/**
 * Periodic check management
 * Handles setup of periodic email checking and cleanup alarms
 */

import { browser } from 'wxt/browser';
import { EMAIL_CHECK_INTERVAL_MS, EMAIL_CLEANUP_INTERVAL_MS } from '@/utils/constants.js';
import { logError } from '@/utils/logger.js';
import type { Alarm, Email, EmailFilters } from '@/utils/types.js';
import { cleanupOldStoredEmails } from './email-storage.js';

export function setupPeriodicEmailCheck(
  checkNewEmailsFn: (inboxId: string, filters: EmailFilters) => Promise<Email[]>
): void {
  browser.alarms.create('checkEmails', {
    periodInMinutes: EMAIL_CHECK_INTERVAL_MS / 60 / 1000,
  });

  browser.alarms.create('cleanupStoredEmails', {
    periodInMinutes: EMAIL_CLEANUP_INTERVAL_MS / 60 / 1000,
  });

  browser.alarms.onAlarm.addListener(async (alarm: Alarm) => {
    if (alarm.name === 'checkEmails') {
      try {
        const { inboxes = [], notificationSettings = { enabled: true } } =
          (await browser.storage.local.get(['inboxes', 'notificationSettings'])) as {
            inboxes?: Array<{ id: string }>;
            notificationSettings?: { enabled: boolean };
          };
        if (!notificationSettings.enabled || inboxes.length === 0) return;
        for (const inbox of inboxes) {
          await checkNewEmailsFn(inbox.id, {});
        }
      } catch (error: unknown) {
        logError(
          'Error in periodic email check:',
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } else if (alarm.name === 'cleanupStoredEmails') {
      try {
        await cleanupOldStoredEmails();
      } catch (error: unknown) {
        logError(
          'Error in stored emails cleanup:',
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  });
}
