/**
 * Email storage management: store, archive, retrieve, and clean up emails
 */

import { browser } from 'wxt/browser';
import { log } from '@/utils/logger.js';
import type {
  Account,
  Analytics,
  Email,
  EmailFilters,
  NotificationSettings,
} from '@/utils/types.js';

const MAX_EMAILS_PER_INBOX = 50;
const ACTIVE_EMAIL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ARCHIVED_EMAIL_RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function getStoredEmails(inboxAddress: string): Promise<Email[]> {
  const { storedEmails = {} } = (await browser.storage.local.get('storedEmails')) as {
    storedEmails?: Record<string, Email[]>;
  };
  return storedEmails[inboxAddress] || [];
}

export async function clearStoredEmails(inboxAddress: string): Promise<void> {
  const { storedEmails = {} } = (await browser.storage.local.get('storedEmails')) as {
    storedEmails?: Record<string, Email[]>;
  };
  delete storedEmails[inboxAddress];
  await browser.storage.local.set({ storedEmails });
  log(`Cleared stored emails for ${inboxAddress}`);
}

export async function archiveInboxEmails(inboxAddress: string): Promise<void> {
  const { storedEmails = {}, archivedEmails = {} } = (await browser.storage.local.get([
    'storedEmails',
    'archivedEmails',
  ])) as {
    storedEmails?: Record<string, Email[]>;
    archivedEmails?: Record<string, Email[]>;
  };

  if (storedEmails[inboxAddress] && storedEmails[inboxAddress].length > 0) {
    if (!archivedEmails[inboxAddress]) {
      archivedEmails[inboxAddress] = [];
    }

    const emailsToArchive = storedEmails[inboxAddress].map((email: Email) => ({
      ...email,
      archived: true,
      archived_at: Date.now(),
      original_inbox: inboxAddress,
    }));

    archivedEmails[inboxAddress].push(...emailsToArchive);
    delete storedEmails[inboxAddress];

    await browser.storage.local.set({ storedEmails, archivedEmails });
    log(`Archived ${emailsToArchive.length} emails for expired inbox: ${inboxAddress}`);
  }
}

export async function getArchivedEmails(inboxAddress?: string): Promise<Email[]> {
  const { archivedEmails = {} } = (await browser.storage.local.get('archivedEmails')) as {
    archivedEmails?: Record<string, Email[]>;
  };

  if (inboxAddress) {
    return archivedEmails[inboxAddress] || [];
  }

  const allArchived: Email[] = [];
  for (const emails of Object.values(archivedEmails)) {
    allArchived.push(...emails);
  }

  return allArchived.sort(
    (a: Email, b: Email) =>
      ((b as Email & { archived_at?: number }).archived_at || 0) -
      ((a as Email & { archived_at?: number }).archived_at || 0)
  );
}

export async function cleanupOldStoredEmails(): Promise<void> {
  const { storedEmails = {}, archivedEmails = {} } = (await browser.storage.local.get([
    'storedEmails',
    'archivedEmails',
  ])) as {
    storedEmails?: Record<string, Email[]>;
    archivedEmails?: Record<string, Email[]>;
  };
  const activeThreshold = Date.now() - ACTIVE_EMAIL_RETENTION_MS;
  const archivedThreshold = Date.now() - ARCHIVED_EMAIL_RETENTION_MS;
  let totalCleaned = 0;

  for (const [address, emails] of Object.entries(storedEmails)) {
    const filteredEmails = emails.filter((email: Email & { stored_at?: number }) => {
      const emailAge = email.stored_at || email.received_at * 1000;
      return emailAge > activeThreshold;
    });

    if (filteredEmails.length !== emails.length) {
      storedEmails[address] = filteredEmails;
      totalCleaned += emails.length - filteredEmails.length;
    }
  }

  for (const [address, emails] of Object.entries(archivedEmails)) {
    const filteredEmails = emails.filter(
      (email: Email & { archived_at?: number; stored_at?: number }) => {
        const emailAge = email.archived_at || email.stored_at || email.received_at * 1000;
        return emailAge > archivedThreshold;
      }
    );

    if (filteredEmails.length !== emails.length) {
      archivedEmails[address] = filteredEmails;
      totalCleaned += emails.length - filteredEmails.length;
    }
  }

  if (totalCleaned > 0) {
    await browser.storage.local.set({ storedEmails, archivedEmails });
    log(`Cleaned up ${totalCleaned} old emails`);
  }
}

export async function storeNewMessages(inboxAddress: string, newMessages: Email[]): Promise<void> {
  const { storedEmails = {} } = (await browser.storage.local.get('storedEmails')) as {
    storedEmails?: Record<string, Email[]>;
  };
  if (!storedEmails[inboxAddress]) {
    storedEmails[inboxAddress] = [];
  }

  storedEmails[inboxAddress].push(...newMessages);
  storedEmails[inboxAddress].sort((a: Email, b: Email) => b.received_at - a.received_at);

  if (storedEmails[inboxAddress].length > MAX_EMAILS_PER_INBOX) {
    storedEmails[inboxAddress] = storedEmails[inboxAddress].slice(0, MAX_EMAILS_PER_INBOX);
  }

  await browser.storage.local.set({ storedEmails });
  log(`Stored ${newMessages.length} new emails for ${inboxAddress}`);
}

export async function applyFiltersAndProcessMessages(
  messages: Email[],
  filters: EmailFilters = {},
  inbox: Account
): Promise<Email[]> {
  const result = (await browser.storage.local.get(['notificationSettings'])) as {
    notificationSettings?: NotificationSettings;
  };
  const notificationSettings: NotificationSettings = result.notificationSettings ?? {
    enabled: true,
  };

  const tsResult = (await browser.storage.local.get(['lastMessageTimestamps'])) as {
    lastMessageTimestamps?: Record<string, number>;
  };
  const lastMessageTimestamps: Record<string, number> = tsResult.lastMessageTimestamps ?? {};
  const lastTimestamp = lastMessageTimestamps[inbox.id] || 0;
  const newMessages = messages.filter((msg: Email) => msg.received_at * 1000 > lastTimestamp);

  // Send OTP from new messages to active tab
  if (newMessages.length > 0) {
    const latestNewMessageWithOtp = newMessages
      .filter((msg: Email) => msg.otp)
      .sort((a: Email, b: Email) => b.received_at - a.received_at)[0];

    if (latestNewMessageWithOtp) {
      // biome-ignore lint/suspicious/noExplicitAny: Chrome tabs API type
      browser.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs.length > 0 && tabs[0].id) {
          browser.tabs.sendMessage(tabs[0].id, {
            type: 'fillOTP',
            otp: latestNewMessageWithOtp.otp,
          });
        }
      });
    }
  }

  // Update last message timestamp
  if (messages.length > 0) {
    lastMessageTimestamps[inbox.id] = Math.max(
      ...messages.map((msg: Email) => msg.received_at * 1000)
    );
    await browser.storage.local.set({ lastMessageTimestamps });
  }

  // Send notifications for new messages
  if (notificationSettings.enabled && newMessages.length > 0) {
    newMessages.forEach((msg: Email) => {
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: `New Email in ${inbox.address}`,
        message: `${msg.from_name || 'Unknown Sender'}: ${msg.subject || 'No Subject'}`,
        priority: 0,
      });
    });

    const { analytics = {} } = (await browser.storage.local.get(['analytics'])) as {
      analytics?: Analytics;
    };
    (analytics as Analytics).notificationsSent =
      ((analytics as Analytics).notificationsSent || 0) + newMessages.length;
    await browser.storage.local.set({ analytics });
  }

  // Update OTP analytics
  const { analytics = {} }: { analytics: Analytics } = (await browser.storage.local.get([
    'analytics',
  ])) as { analytics: Analytics };
  const otpCount = messages.filter((msg: Email) => msg.otp).length;
  analytics.otpsDetected = (analytics.otpsDetected || 0) + otpCount;
  await browser.storage.local.set({ analytics });

  // Apply filters
  let filteredMessages: Email[] = messages;

  if (filters.searchQuery?.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filteredMessages = filteredMessages.filter((msg: Email) => {
      const subjectMatch = msg.subject?.toLowerCase().includes(query);
      const fromMatch = msg.from_name?.toLowerCase().includes(query);
      const bodyMatch = msg.body_plain?.toLowerCase().includes(query);
      return subjectMatch || fromMatch || bodyMatch;
    });
  }

  if (filters.hasOTP) {
    filteredMessages = filteredMessages.filter(
      (msg: Email) => msg.otp && msg.otp.trim().length > 0
    );
  }

  if (filters.senderDomain?.trim()) {
    const senderDomain = filters.senderDomain.toLowerCase().trim();
    filteredMessages = filteredMessages.filter((msg: Email) => {
      const sender = msg.from || msg.from_name || '';
      return sender.toLowerCase().includes(senderDomain);
    });
  }

  if (filters.dateFrom) {
    filteredMessages = filteredMessages.filter(
      (msg: Email) => msg.received_at * 1000 >= filters.dateFrom!
    );
  }

  if (filters.dateTo) {
    filteredMessages = filteredMessages.filter(
      (msg: Email) => msg.received_at * 1000 <= filters.dateTo!
    );
  }

  filteredMessages.forEach((msg: Email) => {
    msg.stored_at = Date.now();
  });

  return filteredMessages;
}
