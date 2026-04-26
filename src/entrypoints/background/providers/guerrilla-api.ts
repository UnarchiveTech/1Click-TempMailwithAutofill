/**
 * Guerrilla Mail API client
 */

import { browser } from 'wxt/browser';
import { FORCE_NEW_SESSIONS_AUTO_CLEAR_MS, GUERRILLA_MAIL_EXPIRY_MS } from '@/utils/constants.js';
import { ApiError, InboxNotFoundError } from '@/utils/errors.js';
import { log, logDebug, logError } from '@/utils/logger.js';
import type { Account } from '@/utils/types.js';
import { PROVIDERS } from './provider-registry.js';

interface GuerrillaApiResponse {
  [key: string]: unknown;
  error?: string;
  sid_token?: string;
  email_addr?: string;
  email_timestamp?: number;
  email_user?: string;
  list?: Array<{ mail_id: number }>;
  ts?: number;
}

/**
 * Makes a call to the Guerrilla Mail API
 * @param func - The API function to call (e.g., 'get_email_address', 'forget_me')
 * @param params - Additional query parameters for the API call
 * @param method - HTTP method to use (default: 'GET')
 * @param sidToken - Optional session token for authenticated requests
 * @returns Promise resolving to the API response data
 * @throws ApiError if the API call fails or returns an error
 */
export async function guerrillaApiCall(
  func: string,
  params: Record<string, string> = {},
  method: string = 'GET',
  sidToken?: string
): Promise<GuerrillaApiResponse> {
  logDebug(`=== GUERRILLA API CALL: ${func} ===`);

  const currentSidToken = sidToken;
  const urlParams = new URLSearchParams({ f: func });

  if (func === 'get_email_address' || func === 'set_email_user') {
    urlParams.append('ip', '127.0.0.1');
    urlParams.append('agent', '1ClickExt');
  }

  if (currentSidToken && func !== 'get_email_address') {
    urlParams.append('sid_token', currentSidToken);
  }

  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value);
  });

  const storage = (await browser.storage.local.get(['forceNewSessions'])) as {
    forceNewSessions?: boolean;
  };
  const shouldForceNewSession = storage.forceNewSessions === true;

  const isGetEmailAddress = func === 'get_email_address';
  const useOmitCredentials = shouldForceNewSession || isGetEmailAddress;

  const fetchOptions: RequestInit = {
    method: method,
    credentials: useOmitCredentials ? 'omit' : 'include',
    cache: useOmitCredentials ? 'no-cache' : 'default',
  };

  if (useOmitCredentials) {
    fetchOptions.headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  if (useOmitCredentials && func === 'get_email_address') {
    urlParams.append('_t', Date.now().toString());
    urlParams.append('_r', Math.random().toString(36).substring(7));
    urlParams.append('_fresh', '1');
  }

  const response = await fetch(
    `${PROVIDERS.guerrilla.apiUrl}?${urlParams.toString()}`,
    fetchOptions
  );

  if (!response.ok) {
    throw new ApiError(
      `Guerrilla Mail API call failed: ${func} returned status ${response.status}`,
      {
        status: response.status,
        url: `${PROVIDERS.guerrilla.apiUrl}?${urlParams.toString()}`,
        operation: func,
      }
    );
  }

  const data = await response.json();

  if (data.error) {
    logError('API returned error:', { data }, new Error(String(data.error)));
  }

  // Auto-clear forceNewSessions after 5 minutes
  if (shouldForceNewSession && response.ok) {
    const stored = (await browser.storage.local.get(['forceNewSessionsTimestamp'])) as {
      forceNewSessionsTimestamp?: number;
    };
    const now = Date.now();

    if (!stored.forceNewSessionsTimestamp) {
      await browser.storage.local.set({ forceNewSessionsTimestamp: now });
    } else if (now - stored.forceNewSessionsTimestamp > FORCE_NEW_SESSIONS_AUTO_CLEAR_MS) {
      await browser.storage.local.remove(['forceNewSessions', 'forceNewSessionsTimestamp']);
    }
  }

  logDebug(`=== GUERRILLA API CALL END: ${func} ===`);
  return data;
}

/**
 * Auto-renews a Guerrilla Mail inbox by getting a fresh session token
 * @param inbox - The inbox account to renew
 * @returns Promise resolving to the updated inbox with new sidToken and expiry
 * @throws InboxNotFoundError if the inbox is not found or lacks sidToken
 * @throws ApiError if the API calls fail during renewal
 */
export async function autoRenewGuerrillaInbox(inbox: Account): Promise<Account> {
  try {
    if (!inbox.sidToken) {
      throw new InboxNotFoundError(inbox.id, { reason: 'No sidToken available for renewal' });
    }

    const currentUser = inbox.address.split('@')[0];

    const newEmailResponse = await guerrillaApiCall('get_email_address');
    if (!newEmailResponse.sid_token) {
      throw new ApiError('Failed to get fresh sidToken for renewal', {
        operation: 'get_email_address',
      });
    }

    const newSidToken = newEmailResponse.sid_token;

    const setUserResponse = await guerrillaApiCall(
      'set_email_user',
      { email_user: currentUser },
      'POST',
      newSidToken
    );

    if (!setUserResponse.email_addr || setUserResponse.email_addr !== inbox.address) {
      throw new ApiError('Failed to restore original email address during renewal', {
        expected: inbox.address,
        received: setUserResponse.email_addr,
      });
    }

    const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
      inboxes?: Account[];
    };
    const inboxIndex = inboxes.findIndex((i: Account) => i.id === inbox.id);

    if (inboxIndex !== -1) {
      const updatedInbox = {
        ...inboxes[inboxIndex],
        sidToken: newSidToken,
        expiresAt:
          ((setUserResponse.email_timestamp || 0) + GUERRILLA_MAIL_EXPIRY_MS / 1000) * 1000,
        expiryNotified: false,
      };

      inboxes[inboxIndex] = updatedInbox;
      await browser.storage.local.set({ inboxes });
      log('Successfully auto-renewed Guerrilla Mail inbox:', inbox.address);

      return updatedInbox;
    } else {
      throw new InboxNotFoundError(inbox.id, {
        reason: 'Inbox not found in storage during renewal',
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(
      'Error auto-renewing Guerrilla Mail inbox:',
      { inboxId: inbox.id, inboxAddress: inbox.address, error: errorMessage },
      error instanceof Error ? error : new Error(errorMessage)
    );
    throw new ApiError(
      `Failed to auto-renew Guerrilla Mail inbox ${inbox.address}: ${errorMessage}`,
      {
        inboxId: inbox.id,
        originalError: error,
      }
    );
  }
}
