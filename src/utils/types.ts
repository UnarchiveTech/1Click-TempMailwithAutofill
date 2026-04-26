/**
 * Shared type definitions for the 1Click: Temp Mail with Autofill extension.
 * Single source of truth — import from here in all entrypoints.
 */

export type MailProvider = 'guerrilla' | 'burner';

// ---- API Response Types ----

export interface GuerrillaEmailResponse {
  mail_id: number;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_timestamp: number;
  mail_body?: string;
  mail_read?: boolean;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

export interface GuerrillaCheckEmailsResponse {
  success: boolean;
  list: GuerrillaEmailResponse[];
  errors?: {
    msg: string;
  };
}

export interface GuerrillaEmailAddressResponse {
  email_addr: string;
  sid_token: string;
}

export interface BurnerCreateInboxResponse {
  address: string;
  token: string;
}

export interface BurnerCheckEmailsResponse {
  messages: Array<{
    id: string;
    from: {
      address: string;
      name?: string;
    };
    subject: string;
    intro: string;
    receivedAt: string;
    body: string;
  }>;
}

export interface BurnerInstanceResponse {
  id: string;
  name: string;
  displayName: string;
  apiUrl: string;
}

// ---- Storage Data Structures ----

export interface StoredEmails {
  [inboxAddress: string]: Email[];
}

export interface ArchivedEmails {
  [inboxAddress: string]: Email[];
}

export interface LastMessageTimestamps {
  [inboxId: string]: number;
}

export interface SeenEmailIds {
  [inboxAddress: string]: string[];
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

export interface DeveloperSettings {
  enableLogging: boolean;
}

export interface StoredSettings {
  passwordSettings?: PasswordSettings;
  nameSettings?: NameSettings;
  autoCopy?: boolean;
  autoRenewGuerrilla?: boolean;
  selectedProvider?: MailProvider;
  selectedBurnerInstance?: string;
  customBurnerInstances?: BurnerInstance[];
  notificationSettings?: NotificationSettings;
  themeMode?: 'light' | 'dark' | 'system';
  developerSettings?: DeveloperSettings;
}

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
  accountsCreated?: number;
  emailsReceived?: number;
  otpsDetected?: number;
  notificationsSent?: number;
}

// ---- Domain Types ----

export interface Account {
  id: string;
  /** The full email address, e.g. "foo@bar.com" */
  address: string;
  provider: MailProvider;
  token?: string; // For burner.kiwi — bearer token
  sidToken?: string; // For guerrilla — per-inbox session token
  lastSequence?: number; // For guerrilla — highest mail_id seen
  createdAt: number; // ms timestamp
  expiresAt: number; // ms timestamp
  expiryNotified?: boolean;
  autoExtend?: boolean;
  tag?: string;
  archived?: boolean;
  // UI-specific properties
  expiry?: string; // Formatted expiry string
  received?: number; // Email count
  lastUsed?: string; // Formatted last used string
  status?: string; // Formatted status string
  emailUser?: string;
}

export interface Email {
  id: string;
  subject?: string;
  body?: string;
  body_html?: string;
  body_plain?: string;
  from?: string;
  from_name?: string;
  received_at: number; // Unix seconds
  otp?: string | null;
  archived?: boolean;
  archived_at?: number;
  stored_at?: number; // ms timestamp (when we stored it)
  original_inbox?: string;
  // UI-specific properties
  time?: string; // Formatted time string
  isOtp?: boolean;
  unread?: boolean;
  date?: string; // Formatted date string
}

export interface SavedLogin {
  id: string;
  website: string;
  email: string;
  password: string;
  otp?: string;
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
  senderDomain?: string;
  dateFrom?: number;
  dateTo?: number;
}

export interface SavedSearchFilter {
  id: string;
  name: string;
  searchQuery: string;
  hasOTP: boolean;
  senderDomain: string;
  dateFrom: string;
  dateTo: string;
  createdAt: number;
}

// ---- Component Props Interfaces ----

export interface MainViewProps {
  selectedEmail: string;
  emails: Email[];
  loading: boolean;
  latestOtp: string;
  otpContext: string;
  notificationsEnabled: boolean;
  inboxes: Account[];
  onCreateInbox: () => void;
  onRefreshInbox: () => void;
  onToggleNotifications: () => void;
  onCopyEmail: () => void;
  onOpenQrDialog: () => void;
  onOpenEmailDetail: (account: Account) => void;
  onEditAccount: (account: Account) => void;
  onExtendAccount: (account: Account) => void;
  onRemoveAccount: (address: string) => void;
  onArchiveAccount: (account: Account) => void;
  onOpenArchivedEmails: () => void;
  onOpenExpiredEmails: () => void;
  onCopyOtp: () => void;
  onOpenMessageDetail: (message: Email) => void;
  onClearFilters: () => void;
  dropdownOpen: boolean;
  domainMenuOpen: boolean;
  domainMenuPosition: { x: number; y: number };
  filteredEmails: Email[];
  searchQuery: string;
  otpOnly: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onOtpOnlyChange: (checked: boolean) => void;
  onSelectProvider: (provider: string) => void;
  onCloseDropdown: () => void;
  onCloseDomainMenu: () => void;
}

export interface FilterListProps {
  searchQuery: string;
  sortBy: string;
  otpOnly: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onOtpOnlyChange: (checked: boolean) => void;
}

export interface ArchivedEmailsProps {
  onBack: () => void;
  archivedSearch: string;
  filteredArchivedEmails: Email[];
  onSearchChange: (value: string) => void;
  onRestore: (email: Email) => void;
  onDelete: (email: Email) => void;
  onClearSearch: () => void;
}

export interface EmailDetailProps {
  onBack: () => void;
  currentEmailDetail: Account | null;
  emails: Email[];
  loading: boolean;
  onOpenMessageDetail: (mail: Email) => void;
  onRefreshMessages: () => void;
  onExportEmail: () => void;
}

export interface MessageDetailProps {
  onBack: () => void;
  selectedMessage: Email | null;
}

export interface LoginInfoProps {
  onBack: () => void;
  savedLogins: SavedLogin[];
  onDelete: (id: string) => void;
}

export interface SettingsProps {
  onBack: () => void;
  useCustomPassword: boolean;
  customPassword: string;
  useCustomName: boolean;
  customFirstName: string;
  customLastName: string;
  autoCopy: boolean;
  autoRenew: boolean;
  selectedProvider: string;
  savingSettings: boolean;
  loading: boolean;
  onSaveSettings: () => void;
  onHardReset: () => void;
  burnerInstances: BurnerInstance[];
  selectedBurnerInstance: string | null;
  onSetBurnerInstance: (instanceId: string) => void;
  onExportData: () => void;
  onImportData: () => void;
  onProviderChange: (provider: string) => void;
  onAddCustomInstance: (name: string, url: string) => void;
  onLoadBurnerInstances: () => void;
}

export interface AnalyticsProps {
  onBack: () => void;
  analytics: Analytics;
  loading: boolean;
  onLoadAnalytics: () => void;
}

// ---- Export / Import ----

export interface EmailHistoryItem {
  email: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface CredentialsHistoryItem {
  domain: string;
  timestamp: number;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  website?: string | null;
  password?: string;
  inboxId?: string;
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
      activeAccountId?: string;
    };
    accounts: Account[];
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
  | {
      action: 'guerrillaApiCall';
      func: string;
      params?: Record<string, unknown>;
      sidToken?: string;
    }
  | { action: 'getArchivedEmails'; inboxAddress?: string };

// ---- Browser Runtime Types ----

export interface RuntimeMessageSender {
  id?: string;
  url?: string;
  tab?: {
    id: number;
    url?: string;
  };
  frameId?: number;
}

export type MessageResponse = unknown;

export interface Alarm {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

export interface Tab {
  id: number;
  url?: string;
  title?: string;
}
