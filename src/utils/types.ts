/**
 * Shared type definitions for the 1Click: Temp Mail with Autofill extension.
 * Single source of truth ΓÇö import from here in all entrypoints.
 */

export type MailProvider = 'guerrilla' | 'burner';

export interface ProviderConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  type: MailProvider;
}

export interface BurnerInstance {
  id: string;
  name: string;
  displayName: string;
  apiUrl: string;
  isCustom?: boolean;
}

export interface Analytics {
  createdAt?: number;
  inboxesCreated?: number;
  emailsReceived?: number;
  otpsDetected?: number;
  notificationsSent?: number;
}

export interface Inbox {
  id: string;
  /** The full email address, e.g. "foo@bar.com" */
  address: string;
  token?: string;        // For burner.kiwi ΓÇö bearer token
  sidToken?: string;     // For guerrilla ΓÇö per-inbox session token
  lastSequence?: number; // For guerrilla ΓÇö highest mail_id seen
  provider: MailProvider;
  createdAt: number;     // ms timestamp
  expiresAt: number;     // ms timestamp
  expiryNotified?: boolean;
  autoExtend?: boolean;
  archived?: boolean;
}

export interface Message {
  id: string;
  subject?: string;
  body_html?: string;
  body_plain?: string;
  from_name?: string;
  received_at: number;   // Unix seconds
  otp?: string;
  stored_at?: number;    // ms timestamp (when we stored it)
  archived?: boolean;
  archived_at?: number;
  original_inbox?: string;
}

export interface NotificationSettings {
  enabled: boolean;
}

export interface SessionCredentials {
  website?: string;
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  phone?: string;
}

export interface EmailFilters {
  searchQuery?: string;
  hasOTP?: boolean;
}

export interface PasswordSettings {
  useCustom: boolean;
  customPassword?: string;
}

export interface NameSettings {
  useCustom: boolean;
  firstName?: string;
  lastName?: string;
}

// ---- Export / Import ----

export interface EmailHistoryItem {
  email: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface CredentialsHistoryItem {
  domain: string;
  username: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface ExportData {
  version: string;
  exportDate: string;
  data: {
    emailHistory: EmailHistoryItem[];
    credentialsHistory: CredentialsHistoryItem[];
    settings: {
      darkMode: boolean;
      activeInboxId?: string;
    };
    inboxes: Inbox[];
  };
}

export interface ExportResult {
  success: boolean;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  error?: string;
}

export interface DataManager {
  exportData: () => Promise<ExportResult>;
  importData: (file: File) => Promise<ImportResult>;
}

// ---- Background message shapes ----

export type BackgroundMessage =
  | { type: 'createInbox'; provider?: MailProvider; user?: string }
  | { type: 'checkEmails'; inboxId: string; filters?: EmailFilters }
  | { type: 'deleteInbox'; inboxId: string }
  | { type: 'getInboxes' }
  | { type: 'setProvider'; provider: MailProvider }
  | { type: 'getProvider' }
  | { type: 'clearSessionCredentials' }
  | { type: 'updateSessionCredentials'; credentials: Partial<SessionCredentials> }
  | { type: 'getAnalytics' }
  | { type: 'renewGuerrillaInbox'; inboxId: string }
  | { action: 'hardReset' }
  | { action: 'getBurnerInstances' }
  | { action: 'addCustomBurnerInstance'; instance: Omit<BurnerInstance, 'id' | 'isCustom'> }
  | { action: 'removeCustomBurnerInstance'; instanceId: string }
  | { action: 'getSelectedBurnerInstance' }
  | { action: 'setSelectedBurnerInstance'; instanceId: string }
  | { action: 'setBurnerInstance'; instanceId: string }
  | { action: 'initializeDefaultProvider' }
  | { action: 'guerrillaApiCall'; func: string; params?: Record<string, unknown>; sidToken?: string }
  | { action: 'getArchivedEmails'; inboxAddress?: string };
