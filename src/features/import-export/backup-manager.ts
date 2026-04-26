import { logError } from '@/utils/logger.js';
import type {
  Account,
  CredentialsHistoryItem,
  EmailHistoryItem,
  ExportData,
  ExportResult,
  ImportResult,
} from '@/utils/types.js';

// WXT provides 'browser' global; fall back to chrome in non-WXT contexts
// biome-ignore lint/suspicious/noExplicitAny: Fallback for non-WXT contexts
declare const browser: any;
// biome-ignore lint/suspicious/noExplicitAny: Fallback for non-WXT contexts
declare const chrome: any;
const _ext = typeof browser !== 'undefined' ? browser : chrome;

async function exportData(): Promise<ExportResult> {
  try {
    const raw = (await _ext.storage.local.get([
      'emailHistory',
      'credentialsHistory',
      'darkMode',
      'inboxes',
      'activeInboxId',
    ])) as {
      emailHistory?: EmailHistoryItem[];
      credentialsHistory?: CredentialsHistoryItem[];
      darkMode?: boolean;
      inboxes?: Account[];
      activeInboxId?: string;
    };
    const {
      emailHistory = [],
      credentialsHistory = [],
      darkMode = false,
      inboxes = [],
      activeInboxId,
    } = raw;

    const exportData: ExportData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      data: {
        emailHistory,
        credentialsHistory,
        settings: {
          darkMode,
          activeAccountId: activeInboxId,
        },
        accounts: inboxes,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = `oneclickautofill-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (e: unknown) {
    logError('Error exporting data:', undefined, e instanceof Error ? e : new Error(String(e)));
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function importData(file: File): Promise<ImportResult> {
  try {
    const fileContent = await file.text();
    const importedData = JSON.parse(fileContent) as ExportData;

    if (!importedData.version || !importedData.data) {
      throw new Error('Invalid backup file format');
    }

    const {
      emailHistory = [],
      credentialsHistory = [],
      settings = {},
      accounts = [],
    } = importedData.data;

    if (
      !Array.isArray(emailHistory) ||
      !Array.isArray(credentialsHistory) ||
      !Array.isArray(accounts)
    ) {
      throw new Error('Invalid data format in backup file');
    }

    const raw2 = (await _ext.storage.local.get([
      'emailHistory',
      'credentialsHistory',
      'inboxes',
    ])) as {
      emailHistory?: EmailHistoryItem[];
      credentialsHistory?: CredentialsHistoryItem[];
      inboxes?: Account[];
    };
    const {
      emailHistory: existingEmails = [],
      credentialsHistory: existingCreds = [],
      inboxes: existingInboxes = [],
    } = raw2;

    const mergedEmails = [...existingEmails];
    emailHistory.forEach((newEmail: EmailHistoryItem) => {
      if (!mergedEmails.some((existing: EmailHistoryItem) => existing.email === newEmail.email)) {
        mergedEmails.push(newEmail);
      }
    });

    const mergedCreds = [...existingCreds];
    credentialsHistory.forEach((newCred: CredentialsHistoryItem) => {
      if (
        !mergedCreds.some(
          (existing: CredentialsHistoryItem) =>
            existing.domain === newCred.domain && existing.username === newCred.username
        )
      ) {
        mergedCreds.push(newCred);
      }
    });

    const mergedInboxes = [...existingInboxes];
    accounts.forEach((newInbox: Account) => {
      if (!mergedInboxes.some((existing: Account) => existing.id === newInbox.id)) {
        mergedInboxes.push(newInbox);
      }
    });

    const s = settings as { darkMode?: boolean; activeAccountId?: string };
    await _ext.storage.local.set({
      emailHistory: mergedEmails,
      credentialsHistory: mergedCreds,
      inboxes: mergedInboxes,
      darkMode: s.darkMode,
      activeInboxId: s.activeAccountId,
    });

    return { success: true };
  } catch (e: unknown) {
    logError('Error importing data:', undefined, e instanceof Error ? e : new Error(String(e)));
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

declare global {
  interface Window {
    dataManager: {
      exportData: () => Promise<ExportResult>;
      importData: (file: File) => Promise<ImportResult>;
    };
  }
}

window.dataManager = {
  exportData,
  importData,
};

export { exportData, importData };
