import type { ExportData, ExportResult, ImportResult } from './types.js';

// WXT provides 'browser' global; fall back to chrome in non-WXT contexts
declare const browser: any;
declare const chrome: any;
const _ext: any = typeof browser !== 'undefined' ? browser : chrome;

async function exportData(): Promise<ExportResult> {
  try {
    const raw = await _ext.storage.local.get(['emailHistory', 'credentialsHistory', 'darkMode', 'inboxes', 'activeInboxId']) as {
      emailHistory?: any[];
      credentialsHistory?: any[];
      darkMode?: boolean;
      inboxes?: any[];
      activeInboxId?: string;
    };
    const { emailHistory = [], credentialsHistory = [], darkMode = false, inboxes = [], activeInboxId } = raw;
    
    const exportData: ExportData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      data: {
        emailHistory,
        credentialsHistory,
        settings: {
          darkMode,
          activeInboxId
        },
        inboxes
      }
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
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
}

async function importData(file: File): Promise<ImportResult> {
  try {
    const fileContent = await file.text();
    const importedData = JSON.parse(fileContent) as ExportData;
    
    if (!importedData.version || !importedData.data) {
      throw new Error('Invalid backup file format');
    }
    
    const { emailHistory = [], credentialsHistory = [], settings = {}, inboxes = [] } = importedData.data;
    
    if (!Array.isArray(emailHistory) || !Array.isArray(credentialsHistory) || !Array.isArray(inboxes)) {
      throw new Error('Invalid data format in backup file');
    }
    
    const raw2 = await _ext.storage.local.get(['emailHistory', 'credentialsHistory', 'inboxes']) as { emailHistory?: any[]; credentialsHistory?: any[]; inboxes?: any[] };
    const { emailHistory: existingEmails = [], credentialsHistory: existingCreds = [], inboxes: existingInboxes = [] } = raw2;
    
    const mergedEmails = [...existingEmails];
    emailHistory.forEach((newEmail: any) => {
      if (!mergedEmails.some((existing: any) => existing.email === newEmail.email)) {
        mergedEmails.push(newEmail);
      }
    });
    
    const mergedCreds = [...existingCreds];
    credentialsHistory.forEach((newCred: any) => {
      if (!mergedCreds.some((existing: any) => 
        existing.domain === newCred.domain && 
        existing.username === newCred.username)) {
        mergedCreds.push(newCred);
      }
    });
    
    const mergedInboxes = [...existingInboxes];
    inboxes.forEach((newInbox: any) => {
      if (!mergedInboxes.some((existing: any) => existing.id === newInbox.id)) {
        mergedInboxes.push(newInbox);
      }
    });
    
    const s = settings as { darkMode?: boolean; activeInboxId?: string };
    await _ext.storage.local.set({
      emailHistory: mergedEmails,
      credentialsHistory: mergedCreds,
      inboxes: mergedInboxes,
      darkMode: s.darkMode,
      activeInboxId: s.activeInboxId
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
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
  importData
};

export { exportData, importData };
