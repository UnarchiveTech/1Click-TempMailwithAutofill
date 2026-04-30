<script lang="ts">
import DOMPurify from 'dompurify';
import { onDestroy, onMount } from 'svelte';
import { browser } from 'wxt/browser';
import ToastNotification from '@/components/feedback/ToastNotification.svelte';
import ErrorBoundary from '@/components/layout/ErrorBoundary.svelte';
import Footer from '@/components/layout/Footer.svelte';
import Header from '@/components/layout/Header.svelte';
import ConfirmDialog from '@/components/overlays/ConfirmDialog.svelte';
import EditEmailDialog from '@/components/overlays/EditEmailDialog.svelte';
import QrDialog from '@/components/overlays/QrDialog.svelte';
import ArchivedEmails from '@/components/ui/ArchivedEmails.svelte';
import EmailDetail from '@/components/ui/mail/EmailDetail.svelte';
import MessageDetail from '@/components/ui/mail/MessageDetail.svelte';
import Onboarding from '@/components/ui/Onboarding.svelte';
import {
  type AnalyticsSetters,
  loadAnalytics as loadAnalyticsAction,
} from '@/features/analytics/analytics-actions.js';
import {
  type ArchivedSetters,
  deleteArchivedEmail as deleteArchivedEmailAction,
  loadArchivedEmails as loadArchivedEmailsAction,
  restoreArchivedInbox as restoreArchivedInboxAction,
} from '@/features/archived-mail/archived-actions.js';
import { useEmailFilter } from '@/features/inbox/email-filters.js';
import {
  autofillForm as autofillFormAction,
  checkMessages as checkMessagesAction,
  copyEmail as copyEmailAction,
  copyOtp as copyOtpAction,
  createInbox as createInboxAction,
  type InboxSetters,
  loadInboxes as loadInboxesAction,
  refreshInbox as refreshInboxAction,
  selectAccount as selectAccountAction,
  toggleNotifications as toggleNotificationsAction,
} from '@/features/inbox/inbox-actions.js';
import {
  archiveSelected as archiveSelectedAction,
  type BulkActionsSetters,
  deleteSelected as deleteSelectedAction,
  exportSelected as exportSelectedAction,
  toggleSelect as toggleSelectAction,
  toggleSelectAll as toggleSelectAllAction,
  unarchiveSelected as unarchiveSelectedAction,
} from '@/features/inbox/inbox-bulk-actions.js';
import {
  type ExportSetters,
  exportAccountEmails as exportAccountEmailsAction,
  exportEmailsWithFormat as exportEmailsWithFormatAction,
  exportMultipleEMLAsZip as exportMultipleEMLAsZipAction,
  generateMBOXContent as generateMBOXContentAction,
  generateSingleEMLContent as generateSingleEMLContentAction,
  showExportFormatDialog as showExportFormatDialogAction,
} from '@/features/inbox/inbox-export.js';
import {
  archiveAccount as archiveAccountAction,
  closeEditEmailDialog as closeEditEmailDialogAction,
  editEmailAddress as editEmailAddressAction,
  extendAccount as extendAccountAction,
  handleSaveEmailUsername as handleSaveEmailUsernameAction,
  type ManagementSetters,
  openEditEmailDialog as openEditEmailDialogAction,
  removeAccount as removeAccountAction,
  toggleAutoExtend as toggleAutoExtendAction,
  unarchiveAccount as unarchiveAccountAction,
} from '@/features/inbox/inbox-management.js';
import {
  handleKeydown as handleKeydownAction,
  type ShortcutsCallbacks,
} from '@/features/keyboard-shortcuts/shortcuts.js';
import {
  type LoginSetters,
  loadLoginInfo as loadLoginInfoAction,
} from '@/features/login-info/login-actions.js';
import {
  closeQrDialog as closeQrDialogAction,
  copyQrImage as copyQrImageAction,
  downloadQrCode as downloadQrCodeAction,
  generateQRCode as generateQRCodeAction,
  openQrDialog as openQrDialogAction,
  type QRSetters,
} from '@/features/qr/qr-actions.js';
import {
  addCustomInstance as addCustomInstanceAction,
  changeProvider as changeProviderAction,
  exportData as exportDataAction,
  handleColorChange as handleColorChangeAction,
  handleProviderChange as handleProviderChangeAction,
  hardReset as hardResetAction,
  importData as importDataAction,
  loadProviderInstances as loadProviderInstancesAction,
  loadSettings as loadSettingsAction,
  type SettingsSetters,
  saveAutoCopy as saveAutoCopyAction,
  saveAutoRenew as saveAutoRenewAction,
  saveNameSettings as saveNameSettingsAction,
  savePasswordSettings as savePasswordSettingsAction,
  saveSettings as saveSettingsAction,
  setProviderInstance as setProviderInstanceAction,
  toggleDeveloperSettings as toggleDeveloperSettingsAction,
  toggleEnableLogging as toggleEnableLoggingAction,
} from '@/features/settings/settings-actions.js';
import {
  applyCustomColor,
  applyTheme as applyThemeAction,
  listenForSystemThemeChanges,
  setThemeMode as setThemeModeAction,
  type ThemeSetters,
  toggleTheme as toggleThemeAction,
} from '@/features/theme/theme-actions.js';
import { decrypt, encrypt } from '@/utils/crypto.js';
import { ApiError, ValidationError } from '@/utils/errors.js';
import { logError } from '@/utils/logger.js';
import { formatDate, formatTimeLeft, getEmailStatus, timeAgo } from '@/utils/time.js';
import type {
  Account,
  Email,
  ProviderInstance,
  SavedLogin,
  SavedSearchFilter,
} from '@/utils/types.js';
import { validateCustomInstanceName, validateCustomInstanceUrl } from '@/utils/validation.js';
import AboutView from '@/views/AboutView.svelte';
import ActivityView from '@/views/ActivityView.svelte';
import ExtensionSettingsView from '@/views/ExtensionSettingsView.svelte';
import InboxView from '@/views/InboxView.svelte';
import MailManagementView from '@/views/MailManagementView.svelte';
import SavedLoginInfoView from '@/views/SavedLoginInfoView.svelte';
import packageJson from '../../../package.json';

// Cross-browser API (polyfill provides browser, chrome as fallback)
const ext = browser;
let version = $state<string>(packageJson.version);

// --- View state ---
type View =
  | 'main'
  | 'mailSettings'
  | 'settings'
  | 'analytics'
  | 'loginInfo'
  | 'archivedEmails'
  | 'emailDetail'
  | 'messageDetail'
  | 'about';
let currentView = $state<View>('main');

// --- Main view ---
let selectedEmail = $state<string>('');
let dropdownOpen = $state<boolean>(false);
let searchQuery = $state<string>('');
let otpOnly = $state<boolean>(false);
let senderDomain = $state<string>('');
let dateFrom = $state<string>('');
let dateTo = $state<string>('');
let loading = $state<boolean>(false);
let loadingInboxes = $state<boolean>(false);
let loadingEmails = $state<boolean>(false);
let accounts = $state<Account[]>([]);
let allInboxes = $state<Account[]>([]); // Includes archived inboxes for management view
let emails = $state<Email[]>([]);
let latestOtp = $state<string>('------');
let latestOtpSender = $state<string>('');
let latestOtpSenderName = $state<string>('');
let otpContext = $state<string>('');
let notificationsEnabled = $state<boolean>(true);
let savedSearchFilters = $state<SavedSearchFilter[]>([]);
let formDetected = $state<boolean>(false);
let menuOpen = $state<boolean>(false);
let sortBy = $state<string>('date');

// --- Toast notifications ---
interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
  icon?: 'success' | 'error' | 'warning' | 'expired' | 'archived' | 'deleted' | 'info';
  undoAction?: (() => void) | null;
}
let toast = $state<Toast | null>(null);
function showToast(
  message:
    | string
    | {
        message: string;
        type?: 'success' | 'error' | 'warning';
        icon?: 'success' | 'error' | 'warning' | 'expired' | 'archived' | 'deleted' | 'info';
      },
  type: 'success' | 'error' | 'warning' = 'success',
  undoAction: (() => void) | null = null
) {
  if (typeof message === 'string') {
    toast = { message, type, undoAction };
  } else {
    toast = {
      message: message.message,
      type: message.type || type,
      icon: message.icon,
      undoAction,
    };
  }
  setTimeout(() => (toast = null), undoAction ? 5000 : 3000);
}

// --- Confirmation dialog ---
interface ConfirmDialogState {
  message: string;
  onConfirm: () => void;
}
let confirmDialog = $state<ConfirmDialogState | null>(null);
let confirmDialogRef = $state<HTMLElement | null>(null);
let confirmPreviousFocus = $state<HTMLElement | null>(null);
let focusTrapCleanup: (() => void) | null = null;
function showConfirm(message: string, onConfirm: () => void) {
  confirmPreviousFocus = document.activeElement as HTMLElement;
  confirmDialog = { message, onConfirm };
  setTimeout(() => {
    if (confirmDialogRef) {
      confirmDialogRef.focus();
      setupFocusTrap(confirmDialogRef);
    }
  }, 50);
}
function closeConfirm() {
  focusTrapCleanup?.();
  focusTrapCleanup = null;
  confirmDialog = null;
  if (confirmPreviousFocus) {
    confirmPreviousFocus.focus();
    confirmPreviousFocus = null;
  }
}
function setupFocusTrap(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }
  };

  element.addEventListener('keydown', trapFocus);
  focusTrapCleanup = () => element.removeEventListener('keydown', trapFocus);
}

// --- Filtered emails (reactive with memoization) ---
const getFilteredEmails = useEmailFilter(
  () => emails,
  () => ({
    searchQuery,
    otpOnly,
    senderDomain,
    dateFrom,
    dateTo,
    sortBy,
  })
);
let filteredEmails = $derived.by(getFilteredEmails);

// --- Setter objects for feature modules ---
const inboxSetters: InboxSetters = {
  setAccounts: (v) => (accounts = v),
  setAllInboxes: (v) => (allInboxes = v),
  setEmails: (v) => (emails = v),
  setLatestOtp: (v) => (latestOtp = v),
  setLatestOtpSender: (v) => (latestOtpSender = v),
  setLatestOtpSenderName: (v) => (latestOtpSenderName = v),
  setOtpContext: (v) => (otpContext = v),
  setSelectedEmail: (v) => (selectedEmail = v),
  setLoading: (v) => (loading = v),
  setLoadingInboxes: (v) => (loadingInboxes = v),
  setLoadingEmails: (v) => (loadingEmails = v),
  setNotificationsEnabled: (v) => (notificationsEnabled = v),
  setShowToast: (message, type) => showToast(message, type),
};

const settingsSetters: SettingsSetters = {
  setUseCustomPassword: (v) => (useCustomPassword = v),
  setCustomPassword: (v) => (customPassword = v),
  setUseCustomName: (v) => (useCustomName = v),
  setCustomFirstName: (v) => (customFirstName = v),
  setCustomLastName: (v) => (customLastName = v),
  setAutoCopy: (v) => (autoCopy = v),
  setAutoRenew: (v) => (autoRenew = v),
  setSelectedProvider: (v) => (selectedProvider = v),
  setProviderInstances: (v) => (providerInstances = v),
  setSelectedProviderInstance: (v) => (selectedProviderInstance = v),
  setCustomColor: (v) => (customColor = v),
  setShowDeveloperSettings: (v) => (showDeveloperSettings = v),
  setEnableLogging: (v) => (enableLogging = v),
  setSavingSettings: (v) => (savingSettings = v),
  setSettingsLoading: (v) => (settingsLoading = v),
  setShowToast: (message, type) => showToast(message, type),
  loadInboxes: async () => {
    await loadInboxes();
  },
};

const themeSetters: ThemeSetters = {
  setThemeMode: (v) => (themeMode = v),
  setCustomColor: (v) => (customColor = v),
};

const qrSetters: QRSetters = {
  setQrDialogOpen: (open) => (qrDialogOpen = open),
  setQrCanvas: (canvas) => (qrCanvas = canvas),
  setQrDialogElement: (element) => (qrDialogElement = element),
  setPreviousFocusElement: (element) => (previousFocusElement = element),
  setShowToast: (message, type) => showToast(message, type),
};

const exportSetters: ExportSetters = {
  setShowToast: (message, type) => showToast(message, type),
  loadInboxes: async () => {
    await loadInboxes();
  },
};

const bulkActionsSetters: BulkActionsSetters = {
  setSelectedAddresses: (addresses) => (selectedAddresses = addresses),
  setShowToast: (message, type, undoAction) => showToast(message, type, undoAction),
  loadInboxes: async () => {
    await loadInboxes();
  },
  showConfirm: (message, onConfirm) => showConfirm(message, onConfirm),
  closeConfirm: () => closeConfirm(),
};

const managementSetters: ManagementSetters = {
  setSelectedEmail: (email) => (selectedEmail = email),
  setEmails: (v) => (emails = v),
  setLoading: (v) => (loading = v),
  setShowToast: (message, type) => showToast(message, type),
  loadInboxes: async () => {
    await loadInboxes();
  },
  setDropdownOpen: (open) => (dropdownOpen = open),
  setEditingAccount: (account) => (editingAccount = account),
  setEditEmailDialogOpen: (open) => (editEmailDialogOpen = open),
};

const archivedSetters: ArchivedSetters = {
  setArchivedEmails: (emails) => (archivedEmails = emails),
  setShowToast: (message, type) => showToast(message, type),
  loadInboxes: async () => {
    await loadInboxes();
  },
};

const analyticsSetters: AnalyticsSetters = {
  setAnalytics: (analyticsData) => (analytics = analyticsData),
  setAnalyticsLoading: (loading) => (analyticsLoading = loading),
};

const loginSetters: LoginSetters = {
  setSavedLogins: (logins) => (savedLogins = logins),
};

// --- Load inboxes from extension storage ---
let _skipEmailSelection = false;
async function loadInboxes() {
  await loadInboxesAction(ext, inboxSetters, _skipEmailSelection);
}

// --- Check emails for active inbox ---
async function checkMessages(inboxId: string) {
  await checkMessagesAction(ext, inboxId, searchQuery, otpOnly, inboxSetters);
}

async function selectAccount(address: string) {
  await selectAccountAction(
    ext,
    address,
    {
      accounts,
      allInboxes,
      emails,
      latestOtp,
      latestOtpSender,
      latestOtpSenderName,
      otpContext,
      selectedEmail,
      loading,
      loadingInboxes,
      loadingEmails,
      notificationsEnabled,
    },
    inboxSetters
  );
  dropdownOpen = false;
}

function copyEmail() {
  copyEmailAction(selectedEmail, (message) => showToast(message));
}

async function createInbox(provider?: string, instanceId?: string) {
  _skipEmailSelection = true;
  await createInboxAction(ext, inboxSetters, provider, instanceId);
  _skipEmailSelection = false;
}

async function refreshInbox(activeInboxId?: string) {
  // If no inbox ID provided, use the currently selected account's ID
  if (!activeInboxId && selectedEmail) {
    const currentAccount = accounts.find((a) => a.address === selectedEmail);
    if (currentAccount) {
      activeInboxId = currentAccount.id;
    }
  }
  await refreshInboxAction(ext, inboxSetters, activeInboxId);
}

function copyOtp() {
  copyOtpAction(latestOtp, (message) => showToast(message));
}

async function toggleNotifications() {
  await toggleNotificationsAction(ext, notificationsEnabled, inboxSetters);
}

// --- Mail Settings view ---
let mgmtTab = $state<string>('active');
let mgmtSearch = $state<string>('');
let selectedAddresses = $state<Set<string>>(new Set());
let currentEmailDetail = $state<Account | null>(null);

let mgmtAccounts = $derived(
  allInboxes.filter((a) => {
    const matchesTab = a.status === mgmtTab;
    const matchesSearch =
      mgmtSearch === '' ||
      a.address.toLowerCase().includes(mgmtSearch.toLowerCase()) ||
      a.provider.toLowerCase().includes(mgmtSearch.toLowerCase());
    return matchesTab && matchesSearch;
  })
);

let allSelected = $derived(
  mgmtAccounts.length > 0 && mgmtAccounts.every((a) => selectedAddresses.has(a.id))
);

function toggleSelectAll() {
  selectedAddresses = toggleSelectAllAction(mgmtAccounts, selectedAddresses);
}

function toggleSelect(id: string) {
  selectedAddresses = toggleSelectAction(selectedAddresses, id);
}

async function archiveSelected() {
  await archiveSelectedAction(ext, { selectedAddresses, accounts, allInboxes }, bulkActionsSetters);
}

async function unarchiveSelected() {
  await unarchiveSelectedAction(
    ext,
    { selectedAddresses, accounts, allInboxes },
    bulkActionsSetters
  );
}

async function deleteSelected() {
  await deleteSelectedAction(ext, { selectedAddresses, accounts, allInboxes }, bulkActionsSetters);
}

async function toggleAutoExtend(account: Account) {
  await toggleAutoExtendAction(ext, account, managementSetters);
}

async function openEmailDetail(account: Account) {
  currentEmailDetail = account;
  currentView = 'emailDetail';
  loading = true;
  await checkMessages(account.id);
  loading = false;
}

async function autofillForm() {
  await autofillFormAction(ext, selectedEmail, (message, type) => showToast(message, type));
}

// --- Settings view ---
let useCustomPassword = $state(false);
let customPassword = $state('');
let useCustomName = $state(false);
let customFirstName = $state('');
let customLastName = $state('');
let autoCopy = $state(false);
let autoRenew = $state(false);
let selectedProvider = $state('');
let providerInstances: ProviderInstance[] = $state([]);
let selectedProviderInstance = $state<string | null>(null);
let loadingProviderInstances = $state(false);
let savingSettings = $state<boolean>(false);
let settingsLoading = $state<boolean>(false);
let _showCustomInstanceForm = $state<boolean>(false);
let _customInstanceName = $state<string>('');
let _customInstanceUrl = $state<string>('');
let customColor = $state<string>('');
let showDeveloperSettings = $state(false);
let enableLogging = $state(false);

async function loadSettings() {
  await loadSettingsAction(
    ext,
    {
      useCustomPassword,
      customPassword,
      useCustomName,
      customFirstName,
      customLastName,
      autoCopy,
      autoRenew,
      selectedProvider,
      providerInstances,
      selectedProviderInstance,
      customColor,
      showDeveloperSettings,
      enableLogging,
      savingSettings,
      settingsLoading,
    },
    settingsSetters
  );
}

async function saveSettings() {
  await saveSettingsAction(
    ext,
    {
      useCustomPassword,
      customPassword,
      useCustomName,
      customFirstName,
      customLastName,
      autoCopy,
      autoRenew,
      selectedProvider,
      providerInstances,
      selectedProviderInstance,
      customColor,
      showDeveloperSettings,
      enableLogging,
      savingSettings,
      settingsLoading,
    },
    settingsSetters
  );
}

async function toggleDeveloperSettings() {
  await toggleDeveloperSettingsAction(
    ext,
    {
      useCustomPassword,
      customPassword,
      useCustomName,
      customFirstName,
      customLastName,
      autoCopy,
      autoRenew,
      selectedProvider,
      providerInstances,
      selectedProviderInstance,
      customColor,
      showDeveloperSettings,
      enableLogging,
      savingSettings,
      settingsLoading,
    },
    settingsSetters
  );
}

async function toggleEnableLogging() {
  await toggleEnableLoggingAction(
    ext,
    {
      useCustomPassword,
      customPassword,
      useCustomName,
      customFirstName,
      customLastName,
      autoCopy,
      autoRenew,
      selectedProvider,
      providerInstances,
      selectedProviderInstance,
      customColor,
      showDeveloperSettings,
      enableLogging,
      savingSettings,
      settingsLoading,
    },
    settingsSetters
  );
}

async function handleProviderChange(provider: string) {
  await handleProviderChangeAction(ext, provider, settingsSetters);
}

async function savePasswordSettings() {
  await savePasswordSettingsAction(ext, {
    useCustomPassword,
    customPassword,
    useCustomName,
    customFirstName,
    customLastName,
    autoCopy,
    autoRenew,
    selectedProvider,
    providerInstances,
    selectedProviderInstance,
    customColor,
    showDeveloperSettings,
    enableLogging,
    savingSettings,
    settingsLoading,
  });
}

async function saveNameSettings() {
  await saveNameSettingsAction(ext, {
    useCustomPassword,
    customPassword,
    useCustomName,
    customFirstName,
    customLastName,
    autoCopy,
    autoRenew,
    selectedProvider,
    providerInstances,
    selectedProviderInstance,
    customColor,
    showDeveloperSettings,
    enableLogging,
    savingSettings,
    settingsLoading,
  });
}

async function saveAutoCopy() {
  await saveAutoCopyAction(ext, autoCopy);
  showToast(`Auto-copy ${autoCopy ? 'enabled' : 'disabled'}`);
}

async function saveAutoRenew() {
  await saveAutoRenewAction(ext, autoRenew);
  showToast(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`);
}

async function handleColorChange(color: string) {
  customColor = color;
  await handleColorChangeAction(ext, color);
}

async function changeProvider(provider: string) {
  await changeProviderAction(ext, provider, settingsSetters);
}

async function loadProviderInstances() {
  await loadProviderInstancesAction(ext, settingsSetters);
}

async function setProviderInstance(instanceId: string) {
  await setProviderInstanceAction(instanceId, ext, settingsSetters);
}

async function addCustomInstance(name: string, url: string) {
  await addCustomInstanceAction(ext, name, url, settingsSetters);
}

async function hardReset() {
  await hardResetAction(ext, settingsSetters);
}

async function exportData() {
  try {
    await exportDataAction(ext);
    showToast('Data exported successfully');
  } catch (_e) {
    showToast('Export failed', 'error');
  }
}

function importData() {
  importDataAction(ext, async () => {
    await loadInboxes();
    showToast('Data imported successfully');
  });
}

// --- Analytics view ---
let analytics = $state({
  createdAt: undefined as string | number | undefined,
  accountsCreated: 0,
  emailsReceived: 0,
  otpsDetected: 0,
  notificationsSent: 0,
});
let analyticsLoading = $state(false);

async function loadAnalytics() {
  await loadAnalyticsAction(ext, { analytics, analyticsLoading }, analyticsSetters);
}

// --- Login Info view ---
let savedLogins = $state<SavedLogin[]>([]);

async function loadLoginInfo() {
  await loadLoginInfoAction(ext, loginSetters);
}

// --- Archived Emails view ---
let archivedEmails = $state<Email[]>([]);
let archivedSearch = $state<string>('');
let filteredArchivedEmails = $derived(
  archivedEmails.filter(
    (e) =>
      archivedSearch === '' ||
      e.subject?.toLowerCase().includes(archivedSearch.toLowerCase()) ||
      e.from?.toLowerCase().includes(archivedSearch.toLowerCase())
  )
);
let _currentMessage = $state<Email | null>(null);
let _currentArchivedEmail = $state<Email | null>(null);
let _qrCanvasRef = $state<HTMLCanvasElement | null>(null);
let _qrDialogRef = $state<HTMLElement | null>(null);
let _toastDialogRef = $state<HTMLElement | null>(null);

async function _loadArchivedEmails() {
  await loadArchivedEmailsAction(ext, archivedSetters);
}

async function _restoreArchivedEmail(email: Email) {
  await restoreArchivedInboxAction(ext, email, { archivedEmails }, archivedSetters);
}

async function deleteArchivedEmail(email: Email) {
  await deleteArchivedEmailAction(email, { archivedEmails }, archivedSetters);
}

// --- QR Code dialog ---
let qrDialogOpen = $state(false);
let qrCanvas = $state<HTMLCanvasElement | null>(null);
let qrDialogElement = $state<HTMLElement | null>(null);
let previousFocusElement = $state<HTMLElement | null>(null);

// --- Edit Email dialog ---
let editEmailDialogOpen = $state(false);
let editingAccount = $state<Account | null>(null);

function openEditEmailDialog(account: Account) {
  openEditEmailDialogAction(account, managementSetters);
}

function closeEditEmailDialog() {
  closeEditEmailDialogAction(managementSetters);
}

async function handleSaveEmailUsername(newUsername: string) {
  await handleSaveEmailUsernameAction(ext, newUsername, editingAccount, managementSetters);
}

// --- Edit email address (Guerrilla only) ---
async function editEmailAddress(account: Account) {
  await editEmailAddressAction(account, managementSetters);
}

async function openQrDialog() {
  await openQrDialogAction(
    selectedEmail,
    { qrDialogOpen, qrCanvas, qrDialogElement, previousFocusElement, customColor },
    qrSetters,
    setupFocusTrap
  );
}

function closeQrDialog() {
  closeQrDialogAction(
    focusTrapCleanup,
    { qrDialogOpen, qrCanvas, qrDialogElement, previousFocusElement, customColor },
    qrSetters
  );
}

function downloadQrCode() {
  downloadQrCodeAction(qrCanvas, selectedEmail, (message) => showToast(message));
}

async function copyQrImage() {
  await copyQrImageAction(qrCanvas, (message, type) => showToast(message, type));
}

// --- Message detail ---
let selectedMessage = $state<Email | null>(null);

function openMessageDetail(message: Email) {
  selectedMessage = message;
  currentView = 'messageDetail';
}

// --- Remove account (delete inbox) ---
async function removeAccount(address: string) {
  await removeAccountAction(
    ext,
    address,
    accounts,
    { selectedEmail, emails, loading },
    managementSetters
  );
}

// --- Archive single account from row ---
async function archiveAccount(account: Account) {
  await archiveAccountAction(ext, account, managementSetters);
}

async function unarchiveAccount(account: Account) {
  await unarchiveAccountAction(ext, account, managementSetters);
}

// --- Export single inbox emails ---
async function exportAccountEmails(account: Account) {
  await exportAccountEmailsAction(ext, account, exportSetters);
}

// --- Show export format dialog ---
function showExportFormatDialog() {
  return showExportFormatDialogAction();
}

/**
 * Exports emails from an account in the specified format.
 *
 * Supported formats:
 * - json: Exports as a JSON file containing address, provider, and message data
 * - eml: Exports as EML format (single email) or ZIP (multiple emails)
 * - mbox: Exports as MBOX format for email clients
 *
 * @param account - The account containing the email address and provider info
 * @param msgs - Array of email messages to export
 * @param format - The export format ('json', 'eml', or 'mbox')
 * @throws Error if export fails
 */
async function exportEmailsWithFormat(account: Account, msgs: Email[], format: string) {
  await exportEmailsWithFormatAction(account, msgs, format);
  showToast(`Emails exported as ${format.toUpperCase()}`);
}

// --- Generate single EML content ---
function generateSingleEMLContent(account: Account, message: Email): string {
  return generateSingleEMLContentAction(account, message);
}

/**
 * Generates MBOX format content from an array of email messages.
 * MBOX is a standard format for storing email messages that can be imported by most email clients.
 * Each message is separated by a "From " line followed by the message content.
 *
 * @param account - The account containing the email address
 * @param messages - Array of email messages to convert to MBOX format
 * @returns A string containing the MBOX formatted email data
 */
function generateMBOXContent(account: Account, messages: Email[]): string {
  return generateMBOXContentAction(account, messages);
}

// --- Export multiple EML as ZIP ---
async function exportMultipleEMLAsZip(account: Account, messages: Email[], baseFilename: string) {
  await exportMultipleEMLAsZipAction(account, messages, baseFilename);
}

// --- Export selected bulk ---
async function exportSelected() {
  await exportSelectedAction(accounts, selectedAddresses, exportAccountEmails);
}

// --- Extend single account (Guerrilla only) ---
async function extendAccount(account: Account) {
  await extendAccountAction(ext, account, managementSetters);
}

// --- Theme management ---
import type { ThemeMode } from '@/features/theme/theme-actions.js';

let themeMode = $state<ThemeMode>('system');

function _toggleTheme() {
  toggleThemeAction({ themeMode, customColor }, themeSetters, ext);
}

function setThemeMode(mode: ThemeMode) {
  setThemeModeAction(mode, themeSetters, ext);
}

function applyTheme() {
  applyThemeAction(themeMode);
}

// Listen for system theme changes
listenForSystemThemeChanges(() => themeMode, applyTheme);

// --- Restore archived email ---
async function restoreArchivedInbox(email: Email) {
  try {
    const result = (await ext.storage.local.get(['inboxes'])) as { inboxes?: Account[] };
    const inboxes = result.inboxes || [];
    const updated = inboxes.map((i: Account) =>
      i.id === email.id ? { ...i, archived: false } : i
    );
    await ext.storage.local.set({ inboxes: updated });
    archivedEmails = archivedEmails.filter((e) => e.id !== email.id);
    showToast('Email restored');
  } catch (_e) {
    showToast('Failed to restore', 'error');
  }
}

function _openMessageWindow(message: Email) {
  // Opens message in a proper popup window like the reference
  const width = 800,
    height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  const win = window.open(
    '',
    '_blank',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`
  );
  if (!win) {
    openMessageDetail(message);
    return;
  }

  // Add lazy loading to images in HTML content
  let bodyHtml = message.body_html || `<pre>${message.body || ''}</pre>`;
  bodyHtml = bodyHtml.replace(/<img([^>]*)>/gi, (match, attrs) => {
    // Add loading="lazy" if not already present
    if (!attrs.includes('loading=')) {
      return `<img${attrs} loading="lazy">`;
    }
    return match;
  });

  const body = DOMPurify.sanitize(bodyHtml);
  const subject = DOMPurify.sanitize(message.subject || 'No Subject');
  const from = DOMPurify.sanitize(message.from || 'Unknown');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${subject}</title>
    <style>body{font-family:system-ui;padding:24px;line-height:1.6}h1{font-size:18px}img{max-width:100%;height:auto}</style></head>
    <body><h1>${subject}</h1><p><b>From:</b> ${from}</p><hr>${body}</body></html>`);
  win.document.close();
}

// --- Saved search filters ---
async function loadSavedSearchFilters() {
  try {
    const result = (await ext.storage.local.get(['savedSearchFilters'])) as {
      savedSearchFilters?: SavedSearchFilter[];
    };
    savedSearchFilters = result.savedSearchFilters || [];
  } catch (e) {
    console.error('Error loading saved search filters:', e);
  }
}

async function saveCurrentFilter(name: string) {
  try {
    const newFilter: SavedSearchFilter = {
      id: Date.now().toString(),
      name,
      searchQuery,
      hasOTP: otpOnly,
      senderDomain,
      dateFrom,
      dateTo,
      createdAt: Date.now(),
    };
    savedSearchFilters = [...savedSearchFilters, newFilter];
    await ext.storage.local.set({ savedSearchFilters });
    showToast('Filter saved');
  } catch (e) {
    console.error('Error saving filter:', e);
    showToast('Failed to save filter', 'error');
  }
}

async function loadFilter(filter: SavedSearchFilter) {
  searchQuery = filter.searchQuery;
  otpOnly = filter.hasOTP;
  senderDomain = filter.senderDomain;
  dateFrom = filter.dateFrom;
  dateTo = filter.dateTo;
  showToast(`Loaded filter: ${filter.name}`);
}

async function deleteFilter(filterId: string) {
  try {
    savedSearchFilters = savedSearchFilters.filter((f) => f.id !== filterId);
    await ext.storage.local.set({ savedSearchFilters });
    showToast('Filter deleted');
  } catch (e) {
    console.error('Error deleting filter:', e);
    showToast('Failed to delete filter', 'error');
  }
}

$effect(() => {
  applyCustomColor(customColor);
});

// --- Initialize on mount ---
onMount(async () => {
  window.addEventListener('keydown', handleKeydown);

  // Listen for storedEmails storage changes (set by background periodic check)
  const handleStorageChange = async (
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>
  ) => {
    if (changes.storedEmails && selectedEmail) {
      // Read emails directly from storage instead of calling checkMessages
      try {
        const { storedEmails = {} } = (await ext.storage.local.get(['storedEmails'])) as {
          storedEmails?: Record<string, Email[]>;
        };
        const inboxEmails = storedEmails[selectedEmail] || [];
        const mappedEmails = inboxEmails.map((m: Email) => ({
          id: m.id,
          from:
            (m as Email & { from_address?: string }).from_address ||
            m.from ||
            m.from_name ||
            'Unknown',
          from_name: m.from_name || '',
          subject: m.subject || 'No Subject',
          time: timeAgo(m.received_at),
          isOtp: !!m.otp,
          otp: m.otp || null,
          body: m.body_plain || (m.body_html || '').replace(/<[^>]*>/g, ''),
          body_html: m.body_html,
          unread: true,
          received_at: m.received_at,
        }));
        inboxSetters.setEmails([...mappedEmails]);
        const latestOtpMsg = inboxEmails
          .filter((m: Email) => m.otp)
          .sort((a: Email, b: Email) => b.received_at - a.received_at)[0];
        if (latestOtpMsg?.otp) {
          inboxSetters.setLatestOtp(latestOtpMsg.otp);
          inboxSetters.setLatestOtpSender(latestOtpMsg.from || '');
          inboxSetters.setLatestOtpSenderName(latestOtpMsg.from_name || '');
          inboxSetters.setOtpContext(
            [
              latestOtpMsg.from_name ? `From: ${latestOtpMsg.from_name}` : '',
              timeAgo(latestOtpMsg.received_at),
            ]
              .filter(Boolean)
              .join(' | ')
          );
        }
      } catch (e) {
        console.error('Error reading emails from storage:', e);
      }
    }
  };

  browser.storage.onChanged.addListener(handleStorageChange);

  // Debounced storage poll function
  let pollTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedPoll = async () => {
    if (pollTimeout) clearTimeout(pollTimeout);
    pollTimeout = setTimeout(async () => {
      if (selectedEmail && !document.hidden) {
        try {
          const { storedEmails = {} } = (await ext.storage.local.get(['storedEmails'])) as {
            storedEmails?: Record<string, Email[]>;
          };
          const inboxEmails = storedEmails[selectedEmail] || [];
          const mappedEmails = inboxEmails.map((m: Email) => ({
            id: m.id,
            from:
              (m as Email & { from_address?: string }).from_address ||
              m.from ||
              m.from_name ||
              'Unknown',
            from_name: m.from_name || '',
            subject: m.subject || 'No Subject',
            time: timeAgo(m.received_at),
            isOtp: !!m.otp,
            otp: m.otp || null,
            body: m.body_plain || (m.body_html || '').replace(/<[^>]*>/g, ''),
            body_html: m.body_html,
            unread: true,
            received_at: m.received_at,
          }));
          inboxSetters.setEmails([...mappedEmails]);
          const latestOtpMsg = inboxEmails
            .filter((m: Email) => m.otp)
            .sort((a: Email, b: Email) => b.received_at - a.received_at)[0];
          if (latestOtpMsg?.otp) {
            inboxSetters.setLatestOtp(latestOtpMsg.otp);
            inboxSetters.setLatestOtpSender(latestOtpMsg.from || '');
            inboxSetters.setLatestOtpSenderName(latestOtpMsg.from_name || '');
            inboxSetters.setOtpContext(
              [
                latestOtpMsg.from_name ? `From: ${latestOtpMsg.from_name}` : '',
                timeAgo(latestOtpMsg.received_at),
              ]
                .filter(Boolean)
                .join(' | ')
            );
          }
        } catch (e) {
          console.error('Error polling emails from storage:', e);
        }
      }
    }, 500); // Debounce for 500ms
  };

  // Poll storage every 10 seconds as backup (more reliable than storage.onChanged)
  // Only poll when page is visible to save resources
  const pollInterval = setInterval(debouncedPoll, 10000);

  // Cleanup on destroy
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    browser.storage.onChanged.removeListener(handleStorageChange);
    clearInterval(pollInterval);
    if (pollTimeout) clearTimeout(pollTimeout);
  });

  // Restore theme settings
  const themeData = (await ext.storage.local.get(['themeMode'])) as { themeMode?: string };
  if (
    themeData.themeMode === 'light' ||
    themeData.themeMode === 'system' ||
    themeData.themeMode === 'dark'
  ) {
    themeMode = themeData.themeMode;
  }
  applyTheme();
  await loadInboxes();
  await loadSettings();
  await loadSavedSearchFilters();
  await loadAnalytics();

  // Check for pending email open from notification click
  const pendingEmailOpen = (await ext.storage.local.get(['pendingEmailOpen'])) as {
    pendingEmailOpen?: { emailId: string; inboxId: string };
  };
  if (pendingEmailOpen.pendingEmailOpen) {
    const { emailId, inboxId } = pendingEmailOpen.pendingEmailOpen;
    // Clear the pending email open
    await ext.storage.local.remove(['pendingEmailOpen']);

    // Find the inbox address from allInboxes list
    const inbox = allInboxes.find((i: Account) => i.id === inboxId);
    if (inbox) {
      // Select this inbox
      await selectAccount(inbox.address);

      // Load emails for this inbox
      loading = true;
      await checkMessages(inbox.id);
      loading = false;

      // Auto-open the email detail for the specific email
      const targetEmail = emails.find((e: Email) => e.id === emailId);
      if (targetEmail) {
        openMessageDetail(targetEmail);
      }
    }
  } else {
    const result = (await ext.storage.local.get(['activeInboxId'])) as { activeInboxId?: string };
    if (result.activeInboxId) {
      loading = true;
      await checkMessages(result.activeInboxId);
      loading = false;
    }
  }
  // Check form detection from active tab via messaging
  try {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const response = await ext.tabs.sendMessage(tab.id, { type: 'checkFormDetected' });
      formDetected = response?.formDetected || false;
    }
  } catch {
    formDetected = false;
  }
  // Listen for tab activation to check form detection on new tab
  ext.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const response = await ext.tabs.sendMessage(activeInfo.tabId, { type: 'checkFormDetected' });
      formDetected = response?.formDetected || false;
    } catch {
      formDetected = false;
    }
  });
});

// --- Keyboard shortcuts ---
function handleKeydown(event: KeyboardEvent) {
  handleKeydownAction(
    event,
    {
      currentView,
      mgmtTab,
      selectedAddresses,
      mgmtSearch,
      qrDialogOpen,
      confirmDialog,
      selectedMessage,
      currentEmailDetail,
    },
    {
      refreshInbox,
      createInbox,
      copyEmail,
      copyOtp,
      closeConfirm,
      closeQrDialog,
      setCurrentView: (view) => (currentView = view as View),
      setSelectedAddresses: (addresses) => (selectedAddresses = addresses),
      setMgmtSearch: (search) => (mgmtSearch = search),
      setSelectedMessage: (message: Email | null) => (selectedMessage = message),
      setCurrentEmailDetail: (detail: Account | null) => (currentEmailDetail = detail),
    }
  );
}

onDestroy(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<ErrorBoundary>
  <div class="flex justify-center items-start min-h-screen bg-base-200">
    <div class="card w-[375px] bg-base-100 shadow-xl flex flex-col transition-all duration-300 ease-in-out rounded-2xl" style="height: 600px; min-height: 600px; padding-left: 7.5px; padding-right: 7.5px;">
      <!-- Header -->
      <Header
        themeMode={themeMode === 'system' ? 'auto' : themeMode}
        onThemeChange={(mode) => setThemeMode(mode === 'auto' ? 'system' : mode)}
      />

    <!-- Main content area -->
    <div class="flex-1 pt-[7.5px] pb-[7.5px] overflow-hidden relative">
      <div class="h-full overflow-x-hidden pb-16 flex flex-col">

  {#if currentView === 'mailSettings'}
    <MailManagementView context="sidepanel"
    onBack={() => { currentView = 'main'; selectedAddresses = new Set(); mgmtSearch = ''; }}
    mgmtTab={mgmtTab}
    mgmtSearch={mgmtSearch}
    selectedAddresses={selectedAddresses}
    mgmtAccounts={mgmtAccounts}
    allSelected={allSelected}
    loadingInboxes={loadingInboxes}
    onTabChange={(tab) => { mgmtTab = tab; selectedAddresses = new Set(); }}
    onSearchChange={(value) => mgmtSearch = value}
    onToggleSelectAll={toggleSelectAll}
    onToggleSelect={(id) => toggleSelect(id)}
    onArchiveSelected={archiveSelected}
    onUnarchiveSelected={unarchiveSelected}
    onDeleteSelected={deleteSelected}
    onExportSelected={exportSelected}
    onOpenEmailDetail={openEmailDetail}
    onArchiveAccount={archiveAccount}
    onUnarchiveAccount={unarchiveAccount}
    onExportAccountEmails={exportAccountEmails}
    onGenerateNewAddress={() => currentView = 'main'}
    onEditAccount={editEmailAddress}
    onExtendAccount={extendAccount}
    />

  {:else if currentView === 'emailDetail'}
    <EmailDetail
      onBack={() => { currentView = 'mailSettings'; currentEmailDetail = null; }}
      currentEmailDetail={currentEmailDetail}
      emails={emails}
      loading={loading}
      onOpenMessageDetail={openMessageDetail}
      onRefreshMessages={async () => {
        if (currentEmailDetail) {
          loading = true;
          await checkMessages(currentEmailDetail.id);
          loading = false;
        }
      }}
      onExportEmail={() => {
        if (currentEmailDetail) {
          exportAccountEmails(currentEmailDetail);
        }
      }}
    />

  {:else if currentView === 'settings'}
    <ExtensionSettingsView context="sidepanel"
      onBack={() => currentView = 'main'}
      useCustomPassword={useCustomPassword}
      customPassword={customPassword}
      useCustomName={useCustomName}
      customFirstName={customFirstName}
      customLastName={customLastName}
      autoCopy={autoCopy}
      autoRenew={autoRenew}
      selectedProvider={selectedProvider}
      savingSettings={savingSettings}
      loading={settingsLoading}
      onSaveSettings={saveSettings}
      onSetUseCustomPassword={(v) => useCustomPassword = v}
      onSetCustomPassword={(v) => customPassword = v}
      onSetUseCustomName={(v) => useCustomName = v}
      onSetCustomFirstName={(v) => customFirstName = v}
      onSetCustomLastName={(v) => customLastName = v}
      onSetAutoCopy={(v) => autoCopy = v}
      onSetAutoRenew={(v) => autoRenew = v}
      onHardReset={hardReset}
      providerInstances={providerInstances}
      selectedProviderInstance={selectedProviderInstance}
      onSetProviderInstance={setProviderInstance}
      onLoadProviderInstances={loadProviderInstances}
      onImportData={importData}
      onProviderChange={handleProviderChange}
      customColor={customColor}
      onColorChange={handleColorChange}
      showDeveloperSettings={showDeveloperSettings}
      enableLogging={enableLogging}
      onToggleDeveloperSettings={toggleDeveloperSettings}
      onToggleEnableLogging={toggleEnableLogging}
    />

  {:else if currentView === 'analytics'}
    <ActivityView context="sidepanel"
      onBack={() => currentView = 'main'}
      analytics={analytics}
      loading={analyticsLoading}
      onLoadAnalytics={loadAnalytics}
    />

  {:else if currentView === 'loginInfo'}
    <SavedLoginInfoView context="sidepanel"
      onBack={() => currentView = 'main'}
      savedLogins={savedLogins}
      onDelete={(id) => savedLogins = savedLogins.filter(l => l.id !== id)}
    />

  {:else if currentView === 'archivedEmails'}
    <ArchivedEmails
      onBack={() => currentView = 'main'}
      archivedSearch={archivedSearch}
      filteredArchivedEmails={filteredArchivedEmails}
      onSearchChange={(value) => archivedSearch = value}
      onRestore={restoreArchivedInbox}
      onDelete={deleteArchivedEmail}
      onClearSearch={() => archivedSearch = ''}
    />

  {:else if currentView === 'messageDetail'}
    <MessageDetail
      onBack={() => { currentView = 'main'; selectedMessage = null; }}
      selectedMessage={selectedMessage}
    />

  {:else if currentView === 'about'}
    <AboutView context="sidepanel" {version} />

  {:else if accounts.length === 0 && !loadingInboxes}
    <Onboarding onCreateInbox={async (provider) => { await createInbox(provider); await loadSettings(); }} />

  {:else}
    <InboxView context="sidepanel"
      selectedEmail={selectedEmail}
      dropdownOpen={dropdownOpen}
      accounts={accounts}
      allAccounts={allInboxes}
      loading={loading}
      searchQuery={searchQuery}
      sortBy={sortBy}
      otpOnly={otpOnly}
      senderDomain={senderDomain}
      dateFrom={dateFrom}
      dateTo={dateTo}
      notificationsEnabled={notificationsEnabled}
      filteredEmails={filteredEmails}
      emails={emails}
      latestOtp={latestOtp}
      latestOtpSender={latestOtpSender}
      latestOtpSenderName={latestOtpSenderName}
      otpContext={otpContext}
      formDetected={formDetected}
      savedSearchFilters={savedSearchFilters}
      onSelectAccount={selectAccount}
      onCopyEmail={copyEmail}
      onOpenQrDialog={openQrDialog}
      onCreateInbox={createInbox}
      onCreateInboxWithProvider={createInbox}
      onAutofillForm={autofillForm}
      onRefreshInbox={refreshInbox}
      onToggleNotifications={toggleNotifications}
      onArchiveAccount={archiveAccount}
      onUnarchiveAccount={unarchiveAccount}
      onRemoveAccount={removeAccount}
      onReloadAccounts={loadInboxes}
      onEditAccount={editEmailAddress}
      onToggleAutoExtend={toggleAutoExtend}
      onOpenMessageDetail={openMessageDetail}
      onOtpOnlyChange={(v) => otpOnly = v}
      onSenderDomainChange={(v) => senderDomain = v}
      onDateFromChange={(v) => dateFrom = v}
      onDateToChange={(v) => dateTo = v}
      onNavigateToSettings={() => currentView = 'settings'}
      onNavigateToManage={() => currentView = 'mailSettings'}
      autoRenew={autoRenew}
      onToggleAutoRenew={async () => { autoRenew = !autoRenew; await saveAutoRenew(); }}
    />
  {/if}

        </div>
        <!-- Floating Island Nav: absolutely stuck to bottom of content area -->
        {#if accounts.length > 0 || loadingInboxes}
        <div class="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div class="pointer-events-auto">
            <Footer currentView={currentView} onNavigate={(view) => currentView = view} />
          </div>
        </div>
        {/if}
    </div>

  <QrDialog
    open={qrDialogOpen}
    {selectedEmail}
    bind:qrDialogElement
    bind:qrCanvas
    onClose={closeQrDialog}
    onDownload={downloadQrCode}
    onCopyImage={copyQrImage}
  />

  <EditEmailDialog
    open={editEmailDialogOpen}
    currentUsername={editingAccount?.address.split('@')[0] || ''}
    domain={editingAccount?.address.split('@')[1] || ''}
    onClose={closeEditEmailDialog}
    onSave={handleSaveEmailUsername}
  />

  <ConfirmDialog
    {confirmDialog}
    bind:confirmDialogRef
    onClose={closeConfirm}
  />

  <ToastNotification {toast} {formDetected} />
  </div>
  </div>
</ErrorBoundary>
