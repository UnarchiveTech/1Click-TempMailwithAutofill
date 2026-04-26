/**
 * Burner.kiwi email fetching
 */

import { browser } from 'wxt/browser';
import { ApiError, InboxCreationError } from '@/utils/errors.js';
import { log } from '@/utils/logger.js';
import type { Account, Email, EmailFilters } from '@/utils/types.js';
import { applyFiltersAndProcessMessages } from '../inbox/email-storage.js';
import { extractOTP } from '../parsing/otp.js';
import { getSelectedBurnerInstance } from './provider-registry.js';

/**
 * Fetches emails from a Burner.kiwi inbox
 * @param inbox - The inbox account to fetch emails from
 * @param filters - Email filtering options
 * @returns Promise resolving to an array of emails with OTP extracted
 * @throws ApiError if the inbox token is missing or API call fails
 * @throws InboxCreationError if no Burner instance is selected
 */
export async function fetchBurnerEmails(inbox: Account, filters: EmailFilters): Promise<Email[]> {
  if (!inbox.token) {
    throw new ApiError(`Burner inbox token not found for inbox ${inbox.address}`, {
      inboxId: inbox.id,
      inboxAddress: inbox.address,
    });
  }

  const selectedInstance = await getSelectedBurnerInstance();
  if (!selectedInstance) {
    throw new InboxCreationError('burner', {
      reason: 'No Burner.kiwi instance selected. Please select an instance in settings.',
    });
  }

  const response = await fetch(`${selectedInstance.apiUrl}/inbox/${inbox.id}/messages`, {
    headers: {
      'X-Burner-Key': inbox.token,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch messages from ${selectedInstance.displayName}: HTTP ${response.status}`,
      {
        status: response.status,
        url: `${selectedInstance.apiUrl}/inbox/${inbox.id}/messages`,
        instance: selectedInstance.displayName,
        inboxId: inbox.id,
      }
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Burner API response type
  const data: any = await response.json();
  if (!data.success) {
    throw new ApiError(
      `Burner API error from ${selectedInstance.displayName}: ${data.errors?.msg || 'Unknown error'}`,
      {
        instance: selectedInstance.displayName,
        error: data.errors,
        inboxId: inbox.id,
      }
    );
  }

  const messages: Email[] = (data.result || []).map(
    (msg: {
      id: string;
      subject: string;
      body: string;
      body_html: string;
      body_plain: string;
      from: string;
      from_name: string;
      received_at: number;
    }) => ({
      id: msg.id,
      subject: msg.subject,
      body: msg.body,
      body_html: msg.body_html,
      body_plain: msg.body_plain,
      from: msg.from,
      from_name: msg.from_name,
      received_at: msg.received_at,
    })
  );

  log(`Fetched ${messages.length} messages`);

  messages.forEach((msg: Email) => {
    const otp = extractOTP(msg.subject || '', msg.body_html || msg.body_plain || '');
    msg.otp = otp || undefined;
  });

  // Get existing stored emails for this inbox
  const { storedEmails = {} } = (await browser.storage.local.get('storedEmails')) as {
    storedEmails?: Record<string, Email[]>;
  };
  if (!storedEmails[inbox.address]) {
    storedEmails[inbox.address] = [];
  }

  // Track which emails we've already stored to avoid duplicates
  const existingEmailIds = new Set(storedEmails[inbox.address].map((email: Email) => email.id));
  const newMessages = messages.filter((msg: Email) => !existingEmailIds.has(msg.id));

  log(`Found ${messages.length} total messages, ${newMessages.length} are new`);

  // Store new messages persistently
  if (newMessages.length > 0) {
    storedEmails[inbox.address].push(...newMessages);

    // Sort by received_at timestamp (newest first)
    storedEmails[inbox.address].sort((a: Email, b: Email) => b.received_at - a.received_at);

    // Keep only the last 50 emails per inbox to prevent storage bloat
    if (storedEmails[inbox.address].length > 50) {
      storedEmails[inbox.address] = storedEmails[inbox.address].slice(0, 50);
    }

    await browser.storage.local.set({ storedEmails });
    log(`Stored ${newMessages.length} new emails for ${inbox.address}`);
  }

  // Return all stored emails for this inbox (both existing and new)
  const allStoredMessages = storedEmails[inbox.address] || [];
  log(`Returning ${allStoredMessages.length} total stored emails for display`);

  return applyFiltersAndProcessMessages(allStoredMessages, filters, inbox);
}
