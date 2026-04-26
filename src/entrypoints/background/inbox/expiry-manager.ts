/**
 * Inbox expiry management
 * Handles inbox expiry checking, auto-renewal, and expiry notifications
 */

import { browser } from 'wxt/browser';
import { EXPIRY_WARNING_THRESHOLD_MS } from '@/utils/constants.js';
import { logError } from '@/utils/logger.js';
import type { Account, NotificationSettings } from '@/utils/types.js';
import { autoRenewGuerrillaInbox } from '../providers/guerrilla-api.js';
import { archiveInboxEmails } from './email-storage.js';

export async function checkInboxExpiry(): Promise<void> {
  try {
    const { inboxes = [], notificationSettings = { enabled: true } } =
      (await browser.storage.local.get(['inboxes', 'notificationSettings'])) as {
        inboxes?: Account[];
        notificationSettings?: NotificationSettings;
      };

    if (!notificationSettings?.enabled || inboxes.length === 0) return;

    const now = Date.now();
    const updatedInboxes = [...inboxes];

    for (let i = 0; i < updatedInboxes.length; i++) {
      const inbox = updatedInboxes[i];

      if (inbox.expiresAt && inbox.expiresAt <= now) {
        if (inbox.autoExtend && inbox.provider === 'guerrilla') {
          try {
            const renewedInbox = await autoRenewGuerrillaInbox(inbox);
            updatedInboxes[i] = renewedInbox;

            if (notificationSettings?.enabled) {
              browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Inbox Auto-Renewed',
                message: `The inbox ${inbox.address} has been automatically renewed.`,
                priority: 1,
              });
            }
          } catch (renewError: unknown) {
            console.error('Failed to auto-renew inbox:', inbox.address, renewError);
            // Archive emails and mark inbox as archived
            await archiveInboxEmails(inbox.address);
            updatedInboxes[i] = { ...inbox, archived: true };

            if (notificationSettings?.enabled) {
              browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Inbox Expired',
                message: `The inbox ${inbox.address} has expired. Emails have been archived for future access.`,
                priority: 1,
              });
            }
            continue;
          }
        } else {
          await archiveInboxEmails(inbox.address);
          updatedInboxes[i] = { ...inbox, archived: true };

          if (notificationSettings?.enabled) {
            browser.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Inbox Expired',
              message: `The inbox ${inbox.address} has expired. Emails have been archived for future access.`,
              priority: 1,
            });
          }
          continue;
        }
      }

      const timeLeft = inbox.expiresAt ? inbox.expiresAt - now : null;
      if (timeLeft && timeLeft <= EXPIRY_WARNING_THRESHOLD_MS && !inbox.expiryNotified) {
        if (notificationSettings?.enabled) {
          browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Inbox Expiring Soon',
            message: `The inbox ${inbox.address} will expire in less than 1 hour.`,
            priority: 1,
          });
        }
        updatedInboxes[i] = { ...inbox, expiryNotified: true };
      }
    }

    await browser.storage.local.set({ inboxes: updatedInboxes });
  } catch (error: unknown) {
    logError(
      'Error in inbox expiry check:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export function setupInboxExpiryCheck(): void {
  const INBOX_EXPIRY_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

  browser.alarms.create('checkInboxExpiry', {
    periodInMinutes: INBOX_EXPIRY_CHECK_INTERVAL_MS / 60 / 1000,
  });

  checkInboxExpiry();

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkInboxExpiry') {
      await checkInboxExpiry();
    }
  });
}
