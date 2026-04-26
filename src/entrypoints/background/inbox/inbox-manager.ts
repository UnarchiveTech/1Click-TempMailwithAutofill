/**
 * Inbox creation, deletion, and email checking
 */

import { browser } from 'wxt/browser';
import { BURNER_MAIL_EXPIRY_MS, GUERRILLA_MAIL_EXPIRY_MS } from '@/utils/constants.js';
import {
  ApiError,
  InboxAlreadyExistsError,
  InboxCreationError,
  InboxNotFoundError,
  InboxSessionConflictError,
  ProviderUnsupportedError,
} from '@/utils/errors.js';
import { logError } from '@/utils/logger.js';
import type { Account, Email, EmailFilters, MailProvider, BurnerInstance } from '@/utils/types.js';
import { fetchBurnerEmails } from '../providers/burner-api.js';
import { guerrillaApiCall } from '../providers/guerrilla-api.js';
import { fetchGuerrillaEmails } from '../providers/guerrilla-email-fetcher.js'; // eslint-disable-line
import { getBurnerInstances, getSelectedBurnerInstance } from '../providers/provider-registry.js';
import { incrementAnalytic } from './analytics.js';
import { archiveInboxEmails, clearStoredEmails } from './email-storage.js';

export interface DeleteInboxResult {
  success: boolean;
  error?: string;
}

/**
 * Creates a new email inbox using the specified provider
 * @param provider - Optional mail provider to use (defaults to selected provider in storage)
 * @param instanceId - Optional burner instance ID to use (only for burner provider)
 * @param _emailUser - Optional email username (currently unused)
 * @returns Promise resolving to the created inbox account
 * @throws InboxCreationError if inbox creation fails
 * @throws ProviderUnsupportedError if the provider is not supported
 * @throws ApiError for other API-related errors
 */
export async function createInbox(provider?: MailProvider, instanceId?: string, _emailUser?: string): Promise<Account> {
  const { selectedProvider = 'burner' } = (await browser.storage.local.get([
    'selectedProvider',
  ])) as { selectedProvider?: string };
  
  // If instanceId is provided, force burner provider
  let activeProvider: MailProvider;
  if (instanceId) {
    activeProvider = 'burner';
  } else {
    activeProvider = (provider || selectedProvider) as MailProvider;
  }

  try {
    let inbox: Account;

    if (activeProvider === 'guerrilla') {
      const data = await guerrillaApiCall('get_email_address');

      if (!data.email_addr) {
        throw new InboxCreationError(
          'guerrilla',
          { response: data },
          new Error('Missing email_addr in Guerrilla Mail API response')
        );
      }

      const { email_addr: address, sid_token: sidToken } = data;
      inbox = {
        id: address,
        address,
        sidToken,
        provider: 'guerrilla',
        createdAt: Date.now(),
        expiresAt: Date.now() + GUERRILLA_MAIL_EXPIRY_MS,
        expiryNotified: false,
        autoExtend: false,
      };
    } else if (activeProvider === 'burner') {
      let selectedInstance: BurnerInstance | null;
      if (instanceId) {
        // Use the specific instance provided
        const instances = await getBurnerInstances();
        selectedInstance = instances.find((i) => i.id === instanceId) || null;
      } else {
        // Use the globally selected instance
        selectedInstance = await getSelectedBurnerInstance();
      }
      
      if (!selectedInstance) {
        throw new InboxCreationError('burner', {
          reason: 'No Burner.kiwi instance selected. Please select an instance in settings.',
        });
      }

      const response = await fetch(`${selectedInstance.apiUrl}/inbox`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new InboxCreationError('burner', {
          status: response.status,
          instance: selectedInstance.displayName,
          errorText,
          reason: `HTTP ${response.status} when creating inbox on ${selectedInstance.displayName}`,
        });
      }

      // biome-ignore lint/suspicious/noExplicitAny: Burner API response type
      const data: any = await response.json();
      if (!data.success) {
        throw new InboxCreationError('burner', {
          instance: selectedInstance.displayName,
          error: data.errors?.msg,
          response: data,
          reason: `Burner API returned failure: ${data.errors?.msg || 'Unknown error'}`,
        });
      }

      const { email, token } = data.result;
      if (!email || !token) {
        throw new InboxCreationError('burner', {
          instance: selectedInstance.displayName,
          reason: 'Missing email or token in Burner API response',
          response: data,
        });
      }
      inbox = {
        id: email.id,
        address: email.address,
        token,
        provider: 'burner',
        createdAt: Date.now(),
        expiresAt: Date.now() + BURNER_MAIL_EXPIRY_MS,
        expiryNotified: false,
        autoExtend: false,
      };
    } else {
      throw new ProviderUnsupportedError(activeProvider);
    }

    const { inboxes = [], seenEmailIds = {} } = (await browser.storage.local.get([
      'inboxes',
      'seenEmailIds',
    ])) as { inboxes?: Account[]; seenEmailIds?: Record<string, string[]> };

    const existingInbox = inboxes.find((e) => e.address === inbox.address);

    if (existingInbox) {
      if (activeProvider === 'guerrilla') {
        const now = Date.now();
        const isExpired = existingInbox.expiresAt && now > existingInbox.expiresAt;

        if (!isExpired && !existingInbox.archived) {
          // Reuse existing valid inbox, update its sidToken
          const inboxIndex = inboxes.findIndex((i: Account) => i.address === existingInbox.address);
          if (inboxIndex !== -1 && inbox.sidToken) {
            inboxes[inboxIndex].sidToken = inbox.sidToken;
            await browser.storage.local.set({ inboxes });
          }
          return inboxes[inboxIndex] || existingInbox;
        } else {
          // Expired/archived: call forget_me and get fresh address
          try {
            await guerrillaApiCall('forget_me', { email_addr: inbox.address });
            const freshData = await guerrillaApiCall('get_email_address');
            if (freshData.email_addr && freshData.email_addr !== inbox.address) {
              inbox.address = freshData.email_addr;
              inbox.id = freshData.email_addr;
              inbox.sidToken = freshData.sid_token;
              inbox.expiresAt =
                ((freshData.email_timestamp || 0) + GUERRILLA_MAIL_EXPIRY_MS / 1000) * 1000;

              const stillDuplicate = inboxes.find(
                (i: Account) => i.address === inbox.address && !i.archived
              );
              if (stillDuplicate) {
                throw new InboxSessionConflictError({ address: inbox.address });
              }
              const cleaned = inboxes.filter((i: Account) => i.address !== existingInbox.address);
              await browser.storage.local.set({ inboxes: cleaned });
              inboxes.length = 0;
              inboxes.push(...cleaned);
            } else {
              throw new ApiError('Failed to get fresh email address from Guerrilla Mail', {
                expectedDifferent: true,
                received: freshData.email_addr,
                original: inbox.address,
              });
            }
          } catch (forgetError: unknown) {
            const msg = forgetError instanceof Error ? forgetError.message : String(forgetError);
            throw new InboxSessionConflictError(
              { originalError: msg },
              forgetError instanceof Error ? forgetError : undefined
            );
          }
        }
      } else if (activeProvider === 'burner') {
        throw new InboxAlreadyExistsError(inbox.address);
      }
    }

    inboxes.push(inbox);
    seenEmailIds[inbox.address] = [];

    await incrementAnalytic('accountsCreated');
    await browser.storage.local.set({ inboxes, seenEmailIds });

    return inbox;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(
      'Error creating inbox:',
      { provider: activeProvider },
      error instanceof Error ? error : new Error(errorMessage)
    );
    throw new ApiError(`Failed to create ${activeProvider} inbox: ${errorMessage}`, {
      provider: activeProvider,
      originalError: error,
    });
  }
}

/**
 * Deletes an inbox from storage
 * @param inboxId - The ID of the inbox to delete
 * @param preserveEmails - Whether to preserve emails in archive (default: true)
 * @returns Promise resolving to delete result with success status
 */
export async function deleteInbox(
  inboxId: string,
  preserveEmails: boolean = true
): Promise<DeleteInboxResult> {
  try {
    const deleteResult = (await browser.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
    const inboxes: Account[] = deleteResult.inboxes ?? [];
    const inbox = inboxes.find((i) => i.id === inboxId);

    if (!inbox) {
      return { success: false, error: `Inbox with ID ${inboxId} not found` };
    }

    if (inbox.provider === 'guerrilla') {
      try {
        await guerrillaApiCall('forget_me', { email_addr: inbox.address });
        await guerrillaApiCall('get_email_address');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(
          'Error during Guerrilla Mail forget_me:',
          { inboxId: inbox.id, inboxAddress: inbox.address, error: errorMessage },
          error instanceof Error ? error : new Error(errorMessage)
        );
        // Continue with deletion even if forget_me fails
      }
    }

    const updatedInboxes = inboxes.filter((i: Account) => i.id !== inboxId);

    const { seenEmailIds = {}, lastMessageTimestamps = {} } = (await browser.storage.local.get([
      'seenEmailIds',
      'lastMessageTimestamps',
    ])) as {
      seenEmailIds?: Record<string, string[]>;
      lastMessageTimestamps?: Record<string, number>;
    };
    if (inbox) {
      delete seenEmailIds[inbox.address];
      delete lastMessageTimestamps[inboxId];

      if (!preserveEmails) {
        await clearStoredEmails(inbox.address);
      } else {
        await archiveInboxEmails(inbox.address);
      }
    }

    await browser.storage.local.set({
      inboxes: updatedInboxes,
      seenEmailIds,
      lastMessageTimestamps,
    });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(
      'Error deleting inbox:',
      { inboxId },
      error instanceof Error ? error : new Error(errorMessage)
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Checks for new emails in a specific inbox
 * @param inboxId - The ID of the inbox to check
 * @param filters - Email filtering options
 * @returns Promise resolving to an array of new emails
 * @throws InboxNotFoundError if the inbox is not found
 * @throws ApiError if email fetching fails
 */
export async function checkNewEmails(
  inboxId: string,
  filters: EmailFilters = {}
): Promise<Email[]> {
  try {
    const checkResult = (await browser.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
    const inboxes: Account[] = checkResult.inboxes ?? [];
    const inbox = inboxes.find((i) => i.id === inboxId);
    if (!inbox) {
      throw new InboxNotFoundError(inboxId, {
        reason: `Inbox with ID ${inboxId} not found in storage`,
      });
    }

    if (inbox.provider === 'guerrilla') {
      return fetchGuerrillaEmails(inbox, filters);
    } else if (inbox.provider === 'burner') {
      return fetchBurnerEmails(inbox, filters);
    } else {
      throw new ProviderUnsupportedError(inbox.provider);
    }
  } catch (error: unknown) {
    if (error instanceof InboxNotFoundError || error instanceof ApiError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(
      'Error checking emails:',
      { inboxId },
      error instanceof Error ? error : new Error(errorMessage)
    );
    throw new ApiError(`Failed to check emails for inbox ${inboxId}: ${errorMessage}`, {
      inboxId,
      originalError: error,
    });
  }
}

// Re-export functions from split modules for backward compatibility
export { checkInboxExpiry, setupInboxExpiryCheck } from './expiry-manager.js';
export { setupPeriodicEmailCheck } from './periodic-checks.js';
