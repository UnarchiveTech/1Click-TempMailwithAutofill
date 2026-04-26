/**
 * Guerrilla Mail email fetching
 */

import { browser } from 'wxt/browser';
import { ApiError } from '@/utils/errors.js';
import { log } from '@/utils/logger.js';
import type { Account, Email, EmailFilters } from '@/utils/types.js';
import { applyFiltersAndProcessMessages, storeNewMessages } from '../inbox/email-storage.js';
import { extractOTP } from '../parsing/otp.js';
import { guerrillaApiCall } from './guerrilla-api.js';

interface GuerrillaListMessage {
  mail_id: number;
}

interface GuerrillaEmailData {
  mail_id: string;
  mail_from: string;
  mail_subject: string;
  mail_body: string;
  mail_excerpt: string;
  mail_date?: string;
  mail_timestamp?: string | number;
}

interface StoredEmail extends Email {}

export async function fetchGuerrillaEmails(
  inbox: Account,
  filters: EmailFilters = {}
): Promise<Email[]> {
  log('=== FETCHING GUERRILLA EMAILS ===');

  if (!inbox.sidToken) {
    throw new ApiError('No sidToken available for this inbox', { inboxId: inbox.id });
  }

  const sequenceNumber = inbox.lastSequence || 0;
  const listData = await guerrillaApiCall(
    'check_email',
    { seq: String(sequenceNumber) },
    'GET',
    inbox.sidToken
  );

  const messages = listData.list || [];
  log(`Found ${messages.length} messages`);

  const { storedEmails = {} } = (await browser.storage.local.get('storedEmails')) as {
    storedEmails?: Record<string, StoredEmail[]>;
  };
  if (!storedEmails[inbox.address]) {
    storedEmails[inbox.address] = [];
  }

  const existingEmailIds = new Set(
    storedEmails[inbox.address].map((email: StoredEmail) => email.id)
  );
  const newMessages = messages.filter(
    (msg: GuerrillaListMessage) => !existingEmailIds.has(String(msg.mail_id))
  );

  log(`${messages.length} total, ${newMessages.length} are new`);

  const newDetailedMessages = await Promise.all(
    newMessages.map(async (msg: GuerrillaListMessage) => {
      const emailData = (await guerrillaApiCall(
        'fetch_email',
        { email_id: String(msg.mail_id) },
        'GET',
        inbox.sidToken
      )) as unknown as GuerrillaEmailData;

      const otp = extractOTP(emailData.mail_subject || '', emailData.mail_body || '');

      let timestamp: number | null = null;

      if (emailData.mail_date && typeof emailData.mail_date === 'string') {
        if (emailData.mail_date.includes('-') && emailData.mail_date.includes(' ')) {
          const parsedDate = new Date(emailData.mail_date);
          if (!Number.isNaN(parsedDate.getTime())) {
            timestamp = Math.floor(parsedDate.getTime() / 1000);
          }
        } else if (emailData.mail_date.includes(':')) {
          const today = new Date();
          const [hours, minutes, seconds] = emailData.mail_date.split(':').map(Number);
          if (!Number.isNaN(hours) && !Number.isNaN(minutes) && !Number.isNaN(seconds)) {
            const emailDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              hours,
              minutes,
              seconds
            );
            timestamp = Math.floor(emailDate.getTime() / 1000);
          }
        }
      }

      if (!timestamp && emailData.mail_timestamp) {
        let mailTimestamp = emailData.mail_timestamp;
        if (typeof mailTimestamp === 'string') {
          const numericTimestamp = parseInt(mailTimestamp, 10);
          if (!Number.isNaN(numericTimestamp) && numericTimestamp > 0) {
            mailTimestamp = numericTimestamp;
          } else {
            const parsedDate = new Date(mailTimestamp);
            if (!Number.isNaN(parsedDate.getTime())) {
              mailTimestamp = Math.floor(parsedDate.getTime() / 1000);
            }
          }
        }
        if (typeof mailTimestamp === 'number' && mailTimestamp > 0) {
          timestamp = mailTimestamp > 1e10 ? Math.floor(mailTimestamp / 1000) : mailTimestamp;
        }
      }

      if (!timestamp || timestamp === 0) {
        timestamp = listData.ts || Math.floor(Date.now() / 1000);
      }

      return {
        id: emailData.mail_id,
        from_name: emailData.mail_from,
        subject: emailData.mail_subject,
        body_html: emailData.mail_body,
        body_plain: emailData.mail_excerpt,
        received_at: timestamp,
        otp: otp || undefined,
        stored_at: Date.now(),
      };
    })
  );

  if (newDetailedMessages.length > 0) {
    await storeNewMessages(inbox.address, newDetailedMessages);
  }

  const allStoredMessages =
    (
      (await browser.storage.local.get('storedEmails')) as {
        storedEmails?: Record<string, StoredEmail[]>;
      }
    ).storedEmails?.[inbox.address] || [];

  // Update sequence number
  if (messages.length > 0) {
    const maxMailId = Math.max(...messages.map((msg: GuerrillaListMessage) => msg.mail_id));
    const { inboxes = [] } = (await browser.storage.local.get('inboxes')) as {
      inboxes?: Account[];
    };
    const updatedInboxes = (inboxes ?? []).map((inb: Account) =>
      inb.id === inbox.id ? { ...inb, lastSequence: maxMailId } : inb
    );
    await browser.storage.local.set({ inboxes: updatedInboxes });
  }

  return applyFiltersAndProcessMessages(allStoredMessages, filters, inbox);
}
