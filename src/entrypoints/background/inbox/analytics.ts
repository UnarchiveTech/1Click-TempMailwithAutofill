/**
 * Analytics management for the extension
 */

import { browser } from 'wxt/browser';
import { log, logError } from '@/utils/logger.js';
import type { Analytics } from '@/utils/types.js';

export async function initializeAnalytics(): Promise<void> {
  try {
    const {
      analytics = {
        accountsCreated: 0,
        emailsReceived: 0,
        otpsDetected: 0,
        notificationsSent: 0,
      },
    }: { analytics: Analytics } = (await browser.storage.local.get(['analytics'])) as {
      analytics: Analytics;
    };
    if (!analytics.createdAt) {
      analytics.createdAt = Date.now();
      analytics.accountsCreated = 0;
      analytics.emailsReceived = 0;
      analytics.otpsDetected = 0;
      analytics.notificationsSent = 0;
      await browser.storage.local.set({ analytics });
      log('Analytics initialized:', analytics);
    }
  } catch (error: unknown) {
    logError('Error initializing analytics:', error);
  }
}

export async function incrementAnalytic(key: keyof Analytics): Promise<void> {
  try {
    const {
      analytics = {
        accountsCreated: 0,
        emailsReceived: 0,
        otpsDetected: 0,
        notificationsSent: 0,
      },
    }: { analytics: Analytics } = (await browser.storage.local.get(['analytics'])) as {
      analytics: Analytics;
    };
    (analytics[key] as number) = ((analytics[key] as number) || 0) + 1;
    await browser.storage.local.set({ analytics });
  } catch (error: unknown) {
    logError('Error updating analytics:', error);
  }
}

export async function getAnalytics(): Promise<Analytics> {
  const {
    analytics = {
      accountsCreated: 0,
      emailsReceived: 0,
      otpsDetected: 0,
      notificationsSent: 0,
    },
  } = (await browser.storage.local.get(['analytics'])) as {
    analytics?: Analytics;
  };
  return analytics;
}
