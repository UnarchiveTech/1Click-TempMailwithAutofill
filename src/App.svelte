<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from 'wxt/browser';
  import packageJson from '../package.json';
  import Footer from './components/Footer.svelte';
  import Settings from './components/Settings.svelte';
  import Analytics from './components/Analytics.svelte';
  import LoginInfo from './components/LoginInfo.svelte';
  import MailSettings from './components/MailSettings.svelte';
  import ArchivedEmails from './components/ArchivedEmails.svelte';
  import EmailDetail from './components/EmailDetail.svelte';
  import MessageDetail from './components/MessageDetail.svelte';
  import MainView from './components/MainView.svelte';
  import Onboarding from './components/Onboarding.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import { encrypt, decrypt } from './utils/crypto';
  import type { SavedSearchFilter } from './utils/types';
  import { timeAgo } from './utils/helpers';
  import DOMPurify from 'dompurify';
  import QRCode from 'qrcode';

  // Cross-browser API (polyfill provides browser, chrome as fallback)
  const ext = browser;
  const version = packageJson.version;

  // --- View state ---
  type View = 'main' | 'mailSettings' | 'settings' | 'analytics' | 'loginInfo' | 'archivedEmails' | 'emailDetail' | 'messageDetail' | 'about';
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
    undoAction?: (() => void) | null;
  }
  let toast = $state<Toast | null>(null);
  function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success', undoAction: (() => void) | null = null) {
    toast = { message, type, undoAction };
    setTimeout(() => toast = null, undoAction ? 5000 : 3000);
  }

  // --- Confirmation dialog ---
  interface ConfirmDialog {
    message: string;
    onConfirm: () => void;
  }
  let confirmDialog = $state<ConfirmDialog | null>(null);
  let confirmDialogRef = $state<HTMLElement | null>(null);
  let confirmPreviousFocus = $state<HTMLElement | null>(null);
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
    confirmDialog = null;
    if (confirmPreviousFocus) {
      confirmPreviousFocus.focus();
      confirmPreviousFocus = null;
    }
  }

  // --- Data interfaces ---
  interface Email {
    id: string;
    from: string;
    subject: string;
    time: string;
    isOtp: boolean;
    otp: string | null;
    body: string;
    body_html?: string;
    unread: boolean;
    received_at: number;
  }

  interface Account {
    id: string;
    address: string;
    provider: string;
    status: string;
    autoExtend: boolean;
    expiry: string;
    created: string;
    lastUsed: string;
    received: number;
    expiresAt: number;
    archived?: boolean;
    sidToken?: string;
    token?: string;
    tag?: string;
  }

  interface ArchivedEmail {
    id: string;
    subject: string;
    from: string;
    date: string;
    body: string;
    originalInboxId: string;
  }

  interface SavedLogin {
    id: string;
    website: string;
    email: string;
    password: string;
    otp?: string;
  }

  interface BurnerInstance {
    id: string;
    name: string;
    url: string;
  }

  // --- Filtered emails (reactive with memoization) ---
  let filterCacheKey = $derived(`${searchQuery}-${otpOnly}-${senderDomain}-${dateFrom}-${dateTo}-${sortBy}`);
  let cachedFilteredEmails: Email[] = [];
  let lastCacheKey = '';

  let filteredEmails = $derived.by(() => {
    const currentKey = filterCacheKey;
    if (currentKey === lastCacheKey && cachedFilteredEmails.length > 0) {
      return cachedFilteredEmails;
    }

    const result = emails.filter(e => {
      const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOtp = otpOnly ? e.isOtp : true;
      const matchesSenderDomain = senderDomain ? e.from.toLowerCase().includes(senderDomain.toLowerCase()) : true;
      
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const emailDate = new Date(e.received_at * 1000);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matchesDateRange = matchesDateRange && emailDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && emailDate <= toDate;
        }
      }
      
      return matchesSearch && matchesOtp && matchesSenderDomain && matchesDateRange;
    }).sort((a, b) => {
      if (sortBy === 'sender') return a.from.localeCompare(b.from);
      return 0;
    });

    cachedFilteredEmails = result;
    lastCacheKey = currentKey;
    return result;
  });

  // --- Time helpers ---
  function formatDate(ts: number | string): string {
    if (!ts) return 'Never';
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString();
  }

  function formatTimeLeft(ms: number): string {
    if (!ms || ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function getEmailStatus(inbox: Account): string {
    if (inbox.archived) return 'archived';
    if (Date.now() > (inbox.expiresAt || 0)) return 'expired';
    return 'active';
  }

  // --- Load inboxes from extension storage ---
  async function loadInboxes() {
    loadingInboxes = true;
    try {
      const result = await ext.storage.local.get(['inboxes', 'activeInboxId']) as { inboxes?: Account[], activeInboxId?: string };
      const inboxes = result.inboxes || [];
      const activeId = result.activeInboxId;
      const now = Date.now();

      // Map all inboxes (including archived) for management view
      allInboxes = inboxes.map((inbox: any) => ({
        id: inbox.id,
        address: inbox.address,
        provider: inbox.provider || 'burner',
        status: getEmailStatus(inbox),
        autoExtend: inbox.autoExtend || false,
        expiry: inbox.autoExtend
          ? 'Auto extend expiry enabled'
          : (inbox.expiresAt || 0) > now
            ? `Expires in ${formatTimeLeft(inbox.expiresAt - now)}`
            : 'Expired',
        created: formatDate(inbox.createdAt),
        lastUsed: formatDate(inbox.createdAt),
        received: 0,
        expiresAt: inbox.expiresAt,
        sidToken: inbox.sidToken,
        token: inbox.token,
        tag: inbox.tag || '',
        archived: inbox.archived || false,
      }));

      // Filter out archived inboxes from main view
      accounts = allInboxes.filter((inbox: any) => !inbox.archived);

      const active = accounts.find(a => a.id === activeId) || accounts.find(a => a.status === 'active');
      if (active) selectedEmail = active.address;
    } catch (e) {
      console.error('loadInboxes error:', e);
    } finally {
      loadingInboxes = false;
    }
  }

  // --- Check emails for active inbox ---
  async function checkMessages(inboxId: string) {
    loadingEmails = true;
    try {
      const response = await ext.runtime.sendMessage({
        type: 'checkEmails',
        inboxId,
        filters: { searchQuery: searchQuery.trim(), hasOTP: otpOnly }
      });
      if (response?.success) {
        const msgs = response.messages || [];
        emails = msgs.map((m: any) => ({
          id: m.id,
          from: m.from_name || 'Unknown',
          subject: m.subject || 'No Subject',
          time: timeAgo(m.received_at),
          isOtp: !!m.otp,
          otp: m.otp || null,
          body: m.body_plain || (m.body_html || '').replace(/<[^>]*>/g, ''),
          body_html: m.body_html,
          unread: true,
          received_at: m.received_at,
        }));

        const latestOtpMsg = msgs.filter((m: any) => m.otp).sort((a: any, b: any) => b.received_at - a.received_at)[0];
        if (latestOtpMsg) {
          latestOtp = latestOtpMsg.otp;
          otpContext = [latestOtpMsg.from_name ? `From: ${latestOtpMsg.from_name}` : '', timeAgo(latestOtpMsg.received_at)].filter(Boolean).join(' | ');
        } else {
          latestOtp = '------';
          otpContext = '';
        }
      }
    } catch (e) {
      console.error('checkMessages error:', e);
    } finally {
      loadingEmails = false;
    }
  }

  async function selectAccount(address: string) {
    selectedEmail = address;
    dropdownOpen = false;
    const acct = accounts.find(a => a.address === address);
    if (acct) {
      await ext.storage.local.set({ activeInboxId: acct.id });
      loading = true;
      emails = []; // Clear emails before loading new account's messages
      cachedFilteredEmails = []; // Clear filter cache
      lastCacheKey = ''; // Reset cache key
      await checkMessages(acct.id);
      loading = false;
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(selectedEmail);
    showToast('Email copied to clipboard');
  }

  async function createInbox(provider?: string) {
    loading = true;
    try {
      const response = await ext.runtime.sendMessage({ type: 'createInbox', provider });
      if (response?.success) {
        await ext.storage.local.set({ activeInboxId: response.inbox.id });
        await loadInboxes();
        await checkMessages(response.inbox.id);
        showToast('New inbox created');
      } else throw new Error(response?.error || 'Failed');
    } catch (e) {
      console.error('createInbox error:', e);
      showToast('Failed to create inbox', 'error');
    } finally {
      loading = false;
    }
  }

  async function refreshInbox() {
    loading = true;
    try {
      const result = await ext.storage.local.get(['activeInboxId']) as { activeInboxId?: string };
      if (result.activeInboxId) {
        await checkMessages(result.activeInboxId);
        showToast('Inbox refreshed');
      }
    } catch (e) {
      console.error('refreshInbox error:', e);
      showToast('Failed to refresh inbox', 'error');
    } finally {
      loading = false;
    }
  }

  function copyOtp() {
    if (latestOtp && latestOtp !== '------') {
      navigator.clipboard.writeText(latestOtp);
      showToast('OTP copied to clipboard');
    }
  }

  async function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    await ext.storage.local.set({ notificationSettings: { enabled: notificationsEnabled } });
    showToast(`Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`);
  }

  // --- Mail Settings view ---
  let mgmtTab = $state<string>('active');
  let mgmtSearch = $state<string>('');
  let selectedAddresses = $state<Set<string>>(new Set());
  let currentEmailDetail = $state<Account | null>(null);

  let mgmtAccounts = $derived(
    allInboxes.filter(a => {
      const matchesTab = a.status === mgmtTab;
      const matchesSearch = mgmtSearch === '' ||
        a.address.toLowerCase().includes(mgmtSearch.toLowerCase()) ||
        a.provider.toLowerCase().includes(mgmtSearch.toLowerCase());
      return matchesTab && matchesSearch;
    })
  );

  let allSelected = $derived(
    mgmtAccounts.length > 0 && mgmtAccounts.every(a => selectedAddresses.has(a.id))
  );

  function toggleSelectAll() {
    if (allSelected) selectedAddresses = new Set();
    else selectedAddresses = new Set(mgmtAccounts.map(a => a.id));
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedAddresses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedAddresses = next;
  }

  async function archiveSelected() {
    try {
      const count = selectedAddresses.size;
      const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
      const inboxes = result.inboxes || [];
      const archivedInboxes = inboxes.filter((i: any) => selectedAddresses.has(i.id));
      const updated = inboxes.map(i => selectedAddresses.has(i.id) ? { ...i, archived: true } : i);
      await ext.storage.local.set({ inboxes: updated });
      await loadInboxes();
      selectedAddresses = new Set();
      showToast(`${count} email(s) archived`, 'success', async () => {
        // Undo: restore archived inboxes
        const currentResult = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
        const currentInboxes = currentResult.inboxes || [];
        const restored = currentInboxes.map((i: any) => {
          const archived = archivedInboxes.find(a => a.id === i.id);
          return archived ? { ...i, archived: false } : i;
        });
        await ext.storage.local.set({ inboxes: restored });
        await loadInboxes();
        showToast('Archive undone');
      });
    } catch (e) {
      showToast('Failed to archive', 'error');
    }
  }

  // --- Delete selected bulk ---
  async function deleteSelected() {
    showConfirm(`Are you sure you want to delete ${selectedAddresses.size} inbox(es)? This cannot be undone.`, async () => {
      try {
        const count = selectedAddresses.size;
        const deletedIds = Array.from(selectedAddresses);
        const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
        const inboxes = result.inboxes || [];
        const deletedInboxes = inboxes.filter((i: any) => selectedAddresses.has(i.id));
        
        for (const id of selectedAddresses) {
          await ext.runtime.sendMessage({ type: 'deleteInbox', inboxId: id });
        }
        await loadInboxes();
        showToast(`${count} inbox(es) deleted`, 'success', async () => {
          // Undo: restore deleted inboxes
          const currentResult = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
          const currentInboxes = currentResult.inboxes || [];
          const restored = [...currentInboxes, ...deletedInboxes];
          await ext.storage.local.set({ inboxes: restored });
          await loadInboxes();
          showToast('Delete undone');
        });
        selectedAddresses = new Set();
        closeConfirm();
      } catch (e) {
        showToast('Failed to delete', 'error');
      }
    });
  }

  async function toggleAutoExtend(account: Account) {
    try {
      const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
      const inboxes = result.inboxes || [];
      const updated = inboxes.map((i: any) => i.id === account.id ? { ...i, autoExtend: !i.autoExtend } : i);
      await ext.storage.local.set({ inboxes: updated });
      await loadInboxes();
      showToast(`Auto-extend ${!account.autoExtend ? 'enabled' : 'disabled'}`);
    } catch (e) {
      showToast('Failed to toggle auto-extend', 'error');
    }
  }

  async function openEmailDetail(account: Account) {
    currentEmailDetail = account;
    currentView = 'emailDetail';
    loading = true;
    await checkMessages(account.id);
    loading = false;
  }

  function autofillForm() {
    ext.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab && tab.id) {
        ext.tabs.sendMessage(tab.id, { action: 'startSignup', email: selectedEmail });
        showToast('Autofill started');
      } else {
        showToast('No active tab found', 'error');
      }
    }).catch(() => showToast('Failed to start autofill', 'error'));
  }

  // --- Settings view ---
  let useCustomPassword = $state(false);
  let customPassword = $state('');
  let useCustomName = $state(false);
  let customFirstName = $state('');
  let customLastName = $state('');
  let autoCopy = $state(false);
  let autoRenew = $state(false);
  let selectedProvider = $state('burner');
  let burnerInstances: BurnerInstance[] = $state([]);
  let selectedBurnerInstance = $state<string | null>(null);
  let loadingBurnerInstances = $state(false);
  let savingSettings = $state<boolean>(false);
  let settingsLoading = $state<boolean>(false);
  let showCustomInstanceForm = $state<boolean>(false);
  let customInstanceName = $state<string>('');
  let customInstanceUrl = $state<string>('');
  let customColor = $state<string>('');

  async function loadSettings() {
    try {
      settingsLoading = true;
      const result = await ext.storage.local.get(['passwordSettings', 'nameSettings', 'autoCopy', 'autoRenewGuerrilla', 'selectedProvider', 'customColor']) as { passwordSettings?: any, nameSettings?: any, autoCopy?: boolean, autoRenewGuerrilla?: boolean, selectedProvider?: string, customColor?: string };
      if (result.passwordSettings) {
        useCustomPassword = result.passwordSettings.useCustom || false;
        if (result.passwordSettings.customPassword) {
          try {
            customPassword = await decrypt(result.passwordSettings.customPassword);
          } catch (e) {
            console.error('Failed to decrypt password:', e);
            customPassword = '';
          }
        }
      }
      if (result.nameSettings) {
        useCustomName = result.nameSettings.useCustom || false;
        customFirstName = result.nameSettings.firstName || '';
        customLastName = result.nameSettings.lastName || '';
      }
      if (result.autoCopy !== undefined) autoCopy = result.autoCopy;
      if (result.autoRenewGuerrilla !== undefined) autoRenew = result.autoRenewGuerrilla;
      if (result.selectedProvider) selectedProvider = result.selectedProvider;
      if (result.customColor) customColor = result.customColor;
    } catch (e) {
      console.error('loadSettings error:', e);
    } finally {
      settingsLoading = false;
    }
  }

  async function saveSettings() {
    savingSettings = true;
    try {
      await ext.storage.local.set({
        passwordSettings: { useCustom: useCustomPassword, customPassword },
        nameSettings: { useCustom: useCustomName, firstName: customFirstName, lastName: customLastName },
        autoCopy,
        autoRenewGuerrilla: autoRenew,
        selectedProvider,
        customColor
      });
      showToast('Settings saved');
    } catch (e) {
      console.error('saveSettings error:', e);
      showToast('Failed to save settings', 'error');
    } finally {
      savingSettings = false;
    }
  }

  async function handleProviderChange(provider: string) {
    selectedProvider = provider;
    await loadInboxes();
  }

  async function savePasswordSettings() {
    let encryptedPassword = customPassword;
    if (useCustomPassword && customPassword) {
      try {
        encryptedPassword = await encrypt(customPassword);
      } catch (e) {
        console.error('Failed to encrypt password:', e);
        showToast('Failed to encrypt password', 'error');
        return;
      }
    }
    await ext.storage.local.set({ passwordSettings: { useCustom: useCustomPassword, customPassword: encryptedPassword } });
  }

  async function saveNameSettings() {
    await ext.storage.local.set({ nameSettings: { useCustom: useCustomName, firstName: customFirstName, lastName: customLastName } });
  }

  async function saveAutoCopy() {
    await ext.storage.local.set({ autoCopy });
    showToast(`Auto-copy ${autoCopy ? 'enabled' : 'disabled'}`);
  }

  async function saveAutoRenew() {
    await ext.storage.local.set({ autoRenewGuerrilla: autoRenew });
    showToast(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`);
  }

  async function handleColorChange(color: string) {
    customColor = color;
    await ext.storage.local.set({ customColor: color });
  }

  async function changeProvider(provider: string) {
    selectedProvider = provider;
    await ext.storage.local.set({ selectedProvider: provider });
    if (provider === 'burner') await loadBurnerInstances();
    await loadInboxes();
    showToast(`Switched to ${provider === 'guerrilla' ? 'Guerrilla Mail' : 'Burner.kiwi'}`);
  }

  async function loadBurnerInstances() {
    loadingBurnerInstances = true;
    try {
      const response = await ext.runtime.sendMessage({ action: 'getBurnerInstances' });
      if (response?.success) burnerInstances = response.instances || [];
      const sel = await ext.runtime.sendMessage({ action: 'getSelectedBurnerInstance' });
      if (sel?.success && sel.instance) selectedBurnerInstance = sel.instance.id;
    } catch (e) {
      console.error('loadBurnerInstances error:', e);
    } finally {
      loadingBurnerInstances = false;
    }
  }

  async function setBurnerInstance(instanceId: string) {
    selectedBurnerInstance = instanceId;
    await ext.runtime.sendMessage({ action: 'setSelectedBurnerInstance', instanceId });
    showToast('Burner instance updated');
    await loadInboxes();
  }

  async function addCustomInstance(name: string, url: string) {
    if (!name.trim() || !url.trim()) {
      showToast('Please fill in all fields', 'error'); return;
    }
    try { new URL(url); } catch { showToast('Invalid URL', 'error'); return; }

    // Domain validation - whitelist allowed domains, block suspicious patterns
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    // Blacklist of suspicious TLDs and patterns
    const blacklistedPatterns = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.zip', '.mov', '.exe', '.bat', '.sh'];
    const isBlacklisted = blacklistedPatterns.some(pattern => domain.includes(pattern));

    // Whitelist of trusted domains (burner.kiwi and common email service domains)
    const whitelistedDomains = ['burner.kiwi', 'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com', 'airmail.cc', 'temp-mail.org'];
    const isWhitelisted = whitelistedDomains.some(allowed => domain === allowed || domain.endsWith('.' + allowed));

    // Allow if whitelisted, block if blacklisted, otherwise warn user
    if (isBlacklisted) {
      showToast('Domain not allowed', 'error'); return;
    }

    if (!isWhitelisted) {
      const confirmed = confirm(`Warning: ${domain} is not in the trusted domains list. Add anyway?`);
      if (!confirmed) return;
    }

    const response = await ext.runtime.sendMessage({
      action: 'addCustomBurnerInstance',
      instance: { name: name.toLowerCase().replace(/\s+/g, '-'), displayName: name, apiUrl: url }
    });
    if (response?.success) {
      showToast('Custom instance added');
      await loadBurnerInstances();
    } else showToast('Failed to add instance', 'error');
  }

  async function hardReset() {
    if (!confirm('⚠ HARD RESET WARNING\n\nThis will permanently delete ALL extension data. This cannot be undone. Are you sure?')) return;
    try {
      await ext.storage.local.clear();
      await (ext.storage.sync as any).clear();
      const response = await ext.runtime.sendMessage({ action: 'hardReset' });
      if (response?.success) {
        showToast('Hard reset completed');
        setTimeout(() => window.location.reload(), 1000);
      } else throw new Error(response?.error);
    } catch (e) {
      showToast('Hard reset failed', 'error');
    }
  }

  async function exportData() {
    try {
      const result = await ext.storage.local.get(['emailHistory', 'credentialsHistory', 'darkMode', 'inboxes', 'activeInboxId']) as { emailHistory?: any, credentialsHistory?: any, darkMode?: string, inboxes?: Account[], activeInboxId?: string };
      const data = { version: '3.0', exportDate: new Date().toISOString(), data: { ...result } };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `1click-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      showToast('Data exported successfully');
    } catch (e) { showToast('Export failed', 'error'); }
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.version || !parsed.data) throw new Error('Invalid format');
        await ext.storage.local.set(parsed.data);
        showToast('Data imported successfully');
        await loadInboxes();
      } catch (err) { showToast('Import failed', 'error'); }
    };
    input.click();
  }

  // --- Analytics view ---
  let analytics = $state({ createdAt: null, inboxesCreated: 0, emailsReceived: 0, otpsDetected: 0, notificationsSent: 0 });
  let analyticsLoading = $state(false);

  async function loadAnalytics() {
    try {
      analyticsLoading = true;
      const response = await ext.runtime.sendMessage({ type: 'getAnalytics' });
      if (response?.success && response.analytics) analytics = response.analytics;
    } catch (e) { console.error('loadAnalytics error:', e); } finally {
      analyticsLoading = false;
    }
  }

  // --- Login Info view ---
  let savedLogins = $state<SavedLogin[]>([]);

  async function loadLoginInfo() {
    try {
      const result = await ext.storage.local.get(['loginInfo']) as { loginInfo?: Record<string, any[]> };
      const loginInfo = result.loginInfo || {};
      savedLogins = Object.entries(loginInfo).flatMap(([domain, entries]: [string, any[]]) =>
        entries.map((entry, i) => ({ id: `${domain}-${i}`, website: domain, ...entry }))
      );
    } catch (e) { console.error('loadLoginInfo error:', e); }
  }

  // --- Archived Emails view ---
  let archivedEmails = $state<ArchivedEmail[]>([]);
  let archivedSearch = $state<string>('');
  let filteredArchivedEmails = $derived(
    archivedEmails.filter(e =>
      archivedSearch === '' ||
      e.subject.toLowerCase().includes(archivedSearch.toLowerCase()) ||
      e.from.toLowerCase().includes(archivedSearch.toLowerCase())
    )
  );
  let currentMessage = $state<Email | null>(null);
  let currentArchivedEmail = $state<ArchivedEmail | null>(null);
  let qrCanvasRef = $state<HTMLCanvasElement | null>(null);
  let qrDialogRef = $state<HTMLElement | null>(null);
  let toastDialogRef = $state<HTMLElement | null>(null);

  async function loadArchivedEmails() {
    try {
      const response = await ext.runtime.sendMessage({ action: 'getArchivedEmails' });
      if (response?.success) {
        archivedEmails = (response.archivedEmails || []).map((m: any) => ({
          id: m.id,
          subject: m.subject || 'No Subject',
          from: m.from_name || 'Unknown',
          date: m.archived_at ? new Date(m.archived_at).toLocaleDateString() : timeAgo(m.received_at),
          otp: m.otp,
          body_html: m.body_html,
          body_plain: m.body_plain,
          received_at: m.received_at,
        }));
      }
    } catch (e) { console.error('loadArchivedEmails error:', e); }
  }

  async function restoreArchivedEmail(email: ArchivedEmail) {
    showToast(`Restored: ${email.subject}`);
  }

  async function deleteArchivedEmail(email: ArchivedEmail) {
    archivedEmails = archivedEmails.filter(e => e.id !== email.id);
    showToast('Archived email deleted');
  }

  // --- QR Code dialog ---
  let qrDialogOpen = $state(false);
  let qrCanvas = $state<HTMLCanvasElement | null>(null);
  let qrDialogElement = $state<HTMLElement | null>(null);
  let previousFocusElement = $state<HTMLElement | null>(null);

  async function openQrDialog() {
    previousFocusElement = document.activeElement as HTMLElement;
    qrDialogOpen = true;
    // Generate QR after dialog opens
    setTimeout(async () => {
      if (qrCanvas) await generateQRCode(qrCanvas, selectedEmail);
      if (qrDialogElement) {
        qrDialogElement.focus();
        setupFocusTrap(qrDialogElement);
      }
    }, 100);
  }

  function closeQrDialog() {
    qrDialogOpen = false;
    if (previousFocusElement) {
      previousFocusElement.focus();
      previousFocusElement = null;
    }
  }

  function setupFocusTrap(dialogElement: HTMLElement) {
    const focusableElements = dialogElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    dialogElement.addEventListener('keydown', handleKeyDown);
    
    // Store the cleanup function
    (dialogElement as any)._focusTrapCleanup = () => {
      dialogElement.removeEventListener('keydown', handleKeyDown);
    };
  }

  async function generateQRCode(canvas: HTMLCanvasElement, text: string) {
    if (!canvas || !text) return;
    try {
      await QRCode.toCanvas(canvas, text, {
        width: 160,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (e) { console.error('QR error:', e); }
  }

  function downloadQrCode() {
    if (!qrCanvas) return;
    const link = document.createElement('a');
    link.download = `qr-${selectedEmail}.png`;
    link.href = qrCanvas.toDataURL();
    link.click();
    showToast('QR code downloaded');
  }

  async function copyQrImage() {
    if (!qrCanvas) return;
    try {
      qrCanvas.toBlob(async (blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showToast('QR code copied to clipboard');
        }
      });
    } catch (e) {
      console.error('Failed to copy QR code:', e);
      showToast('Failed to copy QR code', 'error');
    }
  }

  // --- Message detail ---
  let selectedMessage = $state<Email | null>(null);

  function openMessageDetail(message: Email) {
    selectedMessage = message;
    currentView = 'messageDetail';
  }

  // --- Remove account (delete inbox) ---
  async function removeAccount(address: string) {
    const acct = accounts.find(a => a.address === address);
    if (!acct) return;
    try {
      await ext.runtime.sendMessage({ type: 'deleteInbox', inboxId: acct.id });
      if (selectedEmail === address) {
        selectedEmail = '';
        emails = [];
      }
      dropdownOpen = false;
      await loadInboxes();
      showToast('Address deleted');
    } catch (e) { showToast('Failed to delete address', 'error'); }
  }

  // --- Archive single account from row ---
  async function archiveAccount(account: Account) {
    try {
      await ext.runtime.sendMessage({ type: 'archiveInbox', inboxId: account.id });
      await loadInboxes();
      showToast('Address archived');
    } catch (e) { 
      console.error('archiveAccount error:', e);
      showToast('Failed to archive', 'error'); 
    }
  }

  // --- Export single inbox emails ---
  async function exportAccountEmails(account: Account) {
    try {
      const response = await ext.runtime.sendMessage({ type: 'checkEmails', inboxId: account.id, filters: {} });
      const msgs = response?.messages || [];

      // Show export format dialog
      const format = await showExportFormatDialog();
      if (!format) return;

      await exportEmailsWithFormat(account, msgs, format);
    } catch (e) { showToast('Export failed', 'error'); }
  }

  // --- Show export format dialog ---
  function showExportFormatDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 flex items-center justify-center bg-black/50 z-50';
      dialog.innerHTML = `
        <div class="card bg-base-100 shadow-xl w-96">
          <div class="card-body">
            <h3 class="card-title text-lg">Select Export Format</h3>
            <div class="flex flex-col gap-2 mt-4">
              <button class="btn btn-outline format-btn" data-format="json">JSON Format</button>
              <button class="btn btn-outline format-btn" data-format="eml">EML Format</button>
              <button class="btn btn-outline format-btn" data-format="mbox">MBOX Format</button>
            </div>
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-ghost cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.querySelectorAll('.format-btn').forEach((button: any) => {
        button.addEventListener('click', () => {
          const format = button.getAttribute('data-format');
          document.body.removeChild(dialog);
          resolve(format);
        });
      });

      dialog.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(null);
      });
    });
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
  async function exportEmailsWithFormat(account: Account, msgs: any[], format: string) {
    try {
      let content = '';
      let filename = `${account.address.split('@')[0]}-emails`;
      let mimeType = 'text/plain';

      switch (format) {
        case 'json':
          content = JSON.stringify({ address: account.address, provider: account.provider, messages: msgs }, null, 2);
          filename += '.json';
          mimeType = 'application/json';
          break;
        case 'eml':
          if (msgs.length === 0) {
            content = '# No emails to export';
            filename += '.eml';
          } else if (msgs.length === 1) {
            content = generateSingleEMLContent(account, msgs[0]);
            filename += '.eml';
          } else {
            // Multiple emails - export as ZIP
            await exportMultipleEMLAsZip(account, msgs, filename);
            return;
          }
          mimeType = 'message/rfc822';
          break;
        case 'mbox':
          content = generateMBOXContent(account, msgs);
          filename += '.mbox';
          mimeType = 'application/mbox';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Emails exported as ${format.toUpperCase()}`);
    } catch (e) {
      console.error('Error exporting emails:', e);
      showToast('Export failed', 'error');
    }
  }

  // --- Generate single EML content ---
  function generateSingleEMLContent(account: Account, message: any): string {
    const fromEmail = message.from_name || 'unknown@example.com';
    const subject = message.subject || 'No Subject';
    const date = new Date((message.received_at || Date.now() / 1000) * 1000).toUTCString();
    const body = message.body_html || message.body_plain || 'No content';

    let emlContent = '';
    emlContent += `Return-Path: <${fromEmail}>\n`;
    emlContent += `Delivered-To: ${account.address}\n`;
    emlContent += `From: ${fromEmail}\n`;
    emlContent += `To: ${account.address}\n`;
    emlContent += `Subject: ${subject}\n`;
    emlContent += `Date: ${date}\n`;
    emlContent += `Message-ID: <${message.id || Date.now()}@${account.address}>\n`;
    emlContent += `MIME-Version: 1.0\n`;
    emlContent += `Content-Type: text/plain; charset=UTF-8\n`;
    emlContent += `\n`;
    emlContent += `${body}\n`;

    return emlContent;
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
  function generateMBOXContent(account: Account, messages: any[]): string {
    let mboxContent = '';
    messages.forEach((message, index) => {
      const fromEmail = message.from_name || 'unknown@example.com';
      const subject = message.subject || 'No Subject';
      const date = new Date((message.received_at || Date.now() / 1000) * 1000).toUTCString();
      const body = message.body_html || message.body_plain || 'No content';

      mboxContent += `From ${fromEmail} ${date}\n`;
      mboxContent += `Return-Path: <${fromEmail}>\n`;
      mboxContent += `Delivered-To: ${account.address}\n`;
      mboxContent += `From: ${fromEmail}\n`;
      mboxContent += `To: ${account.address}\n`;
      mboxContent += `Subject: ${subject}\n`;
      mboxContent += `Date: ${date}\n`;
      mboxContent += `Message-ID: <${message.id || Date.now()}-${index}@${account.address}>\n`;
      mboxContent += `\n`;
      mboxContent += `${body}\n`;
      mboxContent += `\n`;
    });
    return mboxContent;
  }

  // --- Export multiple EML as ZIP ---
  async function exportMultipleEMLAsZip(account: Account, messages: any[], baseFilename: string) {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let fileIndex = 1;

      messages.forEach((message) => {
        const emlContent = generateSingleEMLContent(account, message);
        const subject = (message.subject || 'No Subject').replace(/[^a-zA-Z0-9\s]/g, '_').substring(0, 50);
        const sanitizedAddress = account.address.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${fileIndex.toString().padStart(3, '0')}_${sanitizedAddress}_${subject}.eml`;
        zip.file(filename, emlContent);
        fileIndex++;
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}_emails.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Emails exported as ZIP');
    } catch (e) {
      console.error('Error creating ZIP file:', e);
      // Fallback to text format if JSZip fails
      let archiveContent = '# EML Archive - Multiple Email Export\n';
      archiveContent += `# Generated on: ${new Date().toISOString()}\n`;
      archiveContent += '# Note: ZIP creation failed, using text format\n\n';

      let fileIndex = 1;
      messages.forEach((message) => {
        const emlContent = generateSingleEMLContent(account, message);
        const subject = (message.subject || 'No Subject').replace(/[^a-zA-Z0-9\s]/g, '_').substring(0, 50);
        const filename = `${fileIndex.toString().padStart(3, '0')}_${account.address}_${subject}.eml`;
        archiveContent += `=== FILE: ${filename} ===\n`;
        archiveContent += emlContent;
        archiveContent += '\n=== END OF FILE ===\n\n';
        fileIndex++;
      });

      const blob = new Blob([archiveContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}_emails.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Emails exported as text (ZIP unavailable)');
    }
  }

  // --- Export selected bulk ---
  async function exportSelected() {
    for (const id of selectedAddresses) {
      const acct = accounts.find(a => a.id === id);
      if (acct) await exportAccountEmails(acct);
    }
  }

  // --- Edit email address (Guerrilla only) ---
  async function editEmailAddress(account: any) {
    try {
      if (account.provider !== 'guerrilla') {
        showToast('Edit functionality is only available for Guerrilla Mail addresses', 'error');
        return;
      }

      const currentAddress = account.address;
      const currentUser = currentAddress.split('@')[0];
      const domain = currentAddress.split('@')[1];

      const newUser = prompt(`Edit email address (current: ${currentUser})\nEnter new username (domain will remain ${domain}):`, currentUser);

      if (newUser && newUser !== currentUser && newUser.trim()) {
        const newAddress = `${newUser.trim()}@${domain}`;

        // Call background script to change email address
        const response = await ext.runtime.sendMessage({
          action: 'guerrillaApiCall',
          func: 'set_email_user',
          params: { email_user: newUser.trim() },
          sidToken: account.sidToken
        });

        if (response.success && response.data) {
          // Update inbox with new address
          const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
          const inboxes = result.inboxes || [];
          const updatedInboxes = inboxes.map((i: any) => {
            if (i.id === account.id) {
              return {
                ...i,
                address: newAddress,
                id: newAddress
              };
            }
            return i;
          });

          await ext.storage.local.set({ inboxes: updatedInboxes });

          // Update stored emails key
          const storedResult = await ext.storage.local.get('storedEmails') as { storedEmails?: any };
          const storedEmails = storedResult.storedEmails || {};
          if (storedEmails[account.address]) {
            storedEmails[newAddress] = storedEmails[account.address];
            delete storedEmails[account.address];
            await ext.storage.local.set({ storedEmails });
          }

          // Update active inbox if it was the selected one
          const activeResult = await ext.storage.local.get('activeInboxId') as { activeInboxId?: string };
          if (activeResult.activeInboxId === account.id) {
            await ext.storage.local.set({ activeInboxId: newAddress });
          }

          showToast(`Email address changed to ${newAddress}`);
          await loadInboxes();
        } else {
          showToast('Failed to change email address', 'error');
        }
      }
    } catch (e) {
      console.error('Error editing email address:', e);
      showToast('Failed to edit email address', 'error');
    }
  }

  // --- Extend single account (Guerrilla only) ---
  async function extendAccount(account: Account) {
    try {
      if (account.provider !== 'guerrilla') {
        showToast('Extend functionality is only available for Guerrilla Mail addresses', 'error');
        return;
      }

      const currentAddress = account.address;
      const currentUser = currentAddress.split('@')[0];

      showToast('Extending email expiry...');

      // Step 1: Create a new hidden email address to get fresh sidToken
      const newEmailResponse = await ext.runtime.sendMessage({
        action: 'guerrillaApiCall',
        func: 'get_email_address',
        params: {}
      });

      if (!newEmailResponse.success || !newEmailResponse.data.sid_token) {
        showToast('Failed to create temporary address for extension', 'error');
        return;
      }

      const newSidToken = newEmailResponse.data.sid_token;

      // Step 2: Use the new sidToken to set the old email address
      const setUserResponse = await ext.runtime.sendMessage({
        action: 'guerrillaApiCall',
        func: 'set_email_user',
        params: { email_user: currentUser },
        sidToken: newSidToken
      });

      if (setUserResponse.success && setUserResponse.data) {
        // Update inbox with new sidToken and extended expiry
        const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
        const inboxes = result.inboxes || [];
        const updatedInboxes = inboxes.map((i: any) => {
          if (i.id === account.id) {
            return {
              ...i,
              sidToken: newSidToken,
              expiresAt: Date.now() + (60 * 60 * 1000) // Extend by 1 hour
            };
          }
          return i;
        });

        await ext.storage.local.set({ inboxes: updatedInboxes });

        showToast(`Email expiry extended for ${currentAddress}`);
        await loadInboxes();
      } else {
        showToast('Failed to extend email expiry', 'error');
      }
    } catch (e) {
      console.error('Error extending email expiry:', e);
      showToast('Failed to extend email expiry', 'error');
    }
  }

  // --- Theme management ---
  type ThemeMode = 'light' | 'system' | 'dark';
  let themeMode = $state<ThemeMode>('system');

  function toggleTheme() {
    if (themeMode === 'light') {
      themeMode = 'system';
    } else if (themeMode === 'system') {
      themeMode = 'dark';
    } else {
      themeMode = 'light';
    }
    applyTheme();
    ext.storage.local.set({ themeMode });
  }

  function setThemeMode(mode: ThemeMode) {
    themeMode = mode;
    applyTheme();
    ext.storage.local.set({ themeMode });
  }

  function applyTheme() {
    let isDark = false;
    if (themeMode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = themeMode === 'dark';
    }
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'custom');
  }

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (themeMode === 'system') {
      applyTheme();
    }
  });

  // --- Restore archived email ---
  async function restoreArchivedInbox(email: ArchivedEmail) {
    try {
      const result = await ext.storage.local.get(['inboxes']) as { inboxes?: Account[] };
      const inboxes = result.inboxes || [];
      const updated = inboxes.map((i: any) => i.id === email.id ? { ...i, archived: false } : i);
      await ext.storage.local.set({ inboxes: updated });
      archivedEmails = archivedEmails.filter(e => e.id !== email.id);
      showToast('Email restored');
    } catch (e) { showToast('Failed to restore', 'error'); }
  }

  function openMessageWindow(message: Email) {
    // Opens message in a proper popup window like the reference
    const width = 800, height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    const win = window.open('', '_blank', `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
    if (!win) { openMessageDetail(message); return; }
    
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
      const result = await ext.storage.local.get(['savedSearchFilters']) as { savedSearchFilters?: SavedSearchFilter[] };
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
        createdAt: Date.now()
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
      savedSearchFilters = savedSearchFilters.filter(f => f.id !== filterId);
      await ext.storage.local.set({ savedSearchFilters });
      showToast('Filter deleted');
    } catch (e) {
      console.error('Error deleting filter:', e);
      showToast('Failed to delete filter', 'error');
    }
  }

  $effect(() => {
    if (customColor) {
      // DaisyUI 5 uses --color-primary for custom theme
      document.documentElement.style.setProperty('--color-primary', customColor);
      const root = document.querySelector(':root') as HTMLElement;
      if (root) {
        root.style.setProperty('--color-primary', customColor);
      }
    } else {
      document.documentElement.style.removeProperty('--color-primary');
      const root = document.querySelector(':root') as HTMLElement;
      if (root) {
        root.style.removeProperty('--color-primary');
      }
    }
  });

  // --- Initialize on mount ---
  onMount(async () => {
    window.addEventListener('keydown', handleKeydown);
    // Restore theme settings
    const themeData = await ext.storage.local.get(['themeMode']) as { themeMode?: string };
    if (themeData.themeMode === 'light' || themeData.themeMode === 'system' || themeData.themeMode === 'dark') {
      themeMode = themeData.themeMode;
    }
    applyTheme();
    await loadInboxes();
    await loadSettings();
    await loadSavedSearchFilters();
    await loadAnalytics();
    // Apply custom color if set
    if (customColor) {
      // DaisyUI 5 uses --color-primary for custom theme
      document.documentElement.style.setProperty('--color-primary', customColor);
      const root = document.querySelector(':root') as HTMLElement;
      if (root) {
        root.style.setProperty('--color-primary', customColor);
      }
    }
    const result = await ext.storage.local.get(['activeInboxId']) as { activeInboxId?: string };
    if (result.activeInboxId) {
      loading = true;
      await checkMessages(result.activeInboxId);
      loading = false;
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
    // Ctrl/Cmd + R: Refresh inbox
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      refreshInbox();
    }
    // Ctrl/Cmd + N: Create new inbox
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      createInbox();
    }
    // Ctrl/Cmd + C: Copy email (if not in input)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !((event.target as HTMLElement).tagName === 'INPUT') && !((event.target as HTMLElement).tagName === 'TEXTAREA')) {
      event.preventDefault();
      copyEmail();
    }
    // Ctrl/Cmd + O: Copy OTP
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
      event.preventDefault();
      copyOtp();
    }
    // Escape: Close dialogs
    if (event.key === 'Escape') {
      if (currentView === 'mailSettings') {
        currentView = 'main';
        selectedAddresses = new Set();
        mgmtSearch = '';
      } else if (currentView === 'settings' || currentView === 'analytics' || currentView === 'loginInfo' || currentView === 'archivedEmails' || currentView === 'about') {
        currentView = 'main';
      } else if (currentView === 'emailDetail') {
        currentView = 'mailSettings';
        currentEmailDetail = null;
      } else if (currentView === 'messageDetail') {
        currentView = 'main';
        selectedMessage = null;
      } else if (qrDialogOpen) {
        closeQrDialog();
      } else if (confirmDialog) {
        closeConfirm();
      }
    }
  }

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="flex justify-center items-start min-h-screen bg-base-200">
  <div class="card w-[375px] bg-base-100 shadow-xl flex flex-col transition-all duration-300 ease-in-out rounded-none" style="height: 600px; min-height: 600px;">
    <!-- Header -->
    <div class="flex flex-col items-start py-3 px-4 relative">
      <img src="/logo.svg" alt="1Click Logo" class="h-5 w-auto mb-1" />
      <span class="font-medium text-sm tracking-tight text-base-content" style="font-family: system-ui, -apple-system, sans-serif;">Temp Mail & Autofill Form</span>
      <!-- Theme toggle in header bottom right -->
      <div class="absolute top-3 right-4">
        <ThemeToggle themeMode={themeMode === 'system' ? 'auto' : themeMode} onThemeChange={(mode) => setThemeMode(mode === 'auto' ? 'system' : mode)} />
      </div>
    </div>

    <!-- Main content container with b-shaped border -->
    <div class="flex-1 px-2 pb-2 pt-0 overflow-hidden">
      <div class="relative bg-base-200 rounded-[10px] h-full border border-base-300">
        <div class="h-full overflow-auto overflow-x-hidden pb-16">

  {#if currentView === 'mailSettings'}
    <MailSettings
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
      onDeleteSelected={deleteSelected}
      onExportSelected={exportSelected}
      onOpenEmailDetail={openEmailDetail}
      onArchiveAccount={archiveAccount}
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
    <Settings
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
      onHardReset={hardReset}
      burnerInstances={burnerInstances}
      selectedBurnerInstance={selectedBurnerInstance}
      onSetBurnerInstance={setBurnerInstance}
      onExportData={exportData}
      onImportData={importData}
      onProviderChange={handleProviderChange}
      onAddCustomInstance={addCustomInstance}
      onLoadBurnerInstances={loadBurnerInstances}
      customColor={customColor}
      onColorChange={handleColorChange}
    />

  {:else if currentView === 'analytics'}
    <Analytics
      onBack={() => currentView = 'main'}
      analytics={analytics}
      loading={analyticsLoading}
      onLoadAnalytics={loadAnalytics}
    />

  {:else if currentView === 'loginInfo'}
    <LoginInfo
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
    <div class="flex flex-col h-full">
      <div class="flex flex-col items-center gap-5 px-6 py-8">
        <img src="/logo.svg" alt="1Click Logo" class="h-14 w-auto" />
        <div class="text-center">
          <h2 class="font-bold text-base">1Click — Temp Mail & Autofill</h2>
          <span class="badge badge-soft badge-primary mt-1">v{version}</span>
        </div>
        <p class="text-sm text-base-content/60 text-center leading-relaxed">
          A privacy-focused Chrome extension for generating temporary email addresses and auto-filling web forms.
        </p>
        <div class="flex flex-col gap-2 w-full">
          <a
            href="https://github.com/UnarchiveTech/1Click-TempMailwithAutofill"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm w-full gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
            View on GitHub
          </a>
          <button
            class="btn btn-soft btn-error btn-sm w-full gap-2"
            onclick={() => ext.tabs.create({ url: 'https://github.com/UnarchiveTech/1Click-TempMailwithAutofill/issues/new' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            Report an Issue
          </button>
        </div>
        <p class="text-xs text-base-content/40 mt-2">Made with ❤️ by UnarchiveTech</p>
      </div>
    </div>

  {:else if accounts.length === 0 && !loadingInboxes}
    <Onboarding onCreateInbox={async (provider) => { await createInbox(provider); }} />

  {:else}
    <MainView
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
      otpContext={otpContext}
      formDetected={formDetected}
      savedSearchFilters={savedSearchFilters}
      onSelectAccount={selectAccount}
      onCopyEmail={copyEmail}
      onOpenQrDialog={openQrDialog}
      onCreateInbox={createInbox}
      onAutofillForm={autofillForm}
      onRefreshInbox={refreshInbox}
      onToggleNotifications={toggleNotifications}
      onArchiveAccount={archiveAccount}
      onRemoveAccount={removeAccount}
      onEditAccount={editEmailAddress}
      onExtendAccount={toggleAutoExtend}
      onReloadAccounts={loadInboxes}
      onOpenMessageDetail={openMessageDetail}
      onClearFilters={() => { searchQuery = ''; otpOnly = false; senderDomain = ''; dateFrom = ''; dateTo = ''; }}
      onCopyOtp={copyOtp}
      onCopyOtpFromMessage={(otp) => {
        navigator.clipboard.writeText(otp);
        showToast('OTP copied to clipboard');
      }}
      onOpenArchivedEmails={() => currentView = 'archivedEmails'}
      onOpenExpiredEmails={() => currentView = 'archivedEmails'}
      onOtpOnlyChange={(value) => otpOnly = value}
      onSenderDomainChange={(value) => senderDomain = value}
      onDateFromChange={(value) => dateFrom = value}
      onDateToChange={(value) => dateTo = value}
      onSaveFilter={(name) => saveCurrentFilter(name)}
      onLoadFilter={(filter) => loadFilter(filter)}
      onDeleteFilter={(filterId) => deleteFilter(filterId)}
      onNavigateToSettings={() => currentView = 'settings'}
    />
  {/if}

        </div>
        <!-- Floating Island Nav: absolutely stuck to bottom of content area -->
        <div class="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div class="pointer-events-auto">
            <Footer currentView={currentView} onNavigate={(view) => currentView = view} />
          </div>
        </div>
      </div>
    </div>

  <!-- QR Code Dialog Modal -->
  {#if qrDialogOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <!-- Blurred backdrop -->
      <div class="absolute inset-0 bg-base-content/30 backdrop-blur-sm" role="button" tabindex="-1" onclick={closeQrDialog} onkeydown={(e) => e.key === 'Escape' && closeQrDialog()}></div>

      <!-- Close button top-right -->
      <button
        class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center shadow-md transition-colors"
        aria-label="Close dialog"
        onclick={closeQrDialog}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Dialog card -->
      <div
        class="relative z-10 bg-base-100 rounded-2xl shadow-2xl p-4 flex flex-col items-center gap-3 w-60"
        bind:this={qrDialogElement}
        tabindex="-1"
      >
        <!-- QR code container -->
        <div class="bg-base-200 rounded-xl p-3 w-full flex items-center justify-center">
          <canvas bind:this={qrCanvas} width="160" height="160" class="w-40 h-40 rounded-md"></canvas>
        </div>

        <!-- Email address -->
        <p class="text-xs font-medium text-base-content text-center break-all px-1">{selectedEmail}</p>

        <!-- Buttons -->
        <div class="flex flex-col gap-1.5 w-full">
          <button
            class="btn btn-primary btn-sm w-full rounded-xl font-semibold gap-2"
            aria-label="Download QR code"
            onclick={downloadQrCode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download QR
          </button>
          <button
            class="btn bg-primary/10 hover:bg-primary/20 text-primary btn-sm w-full rounded-xl font-semibold border-0 gap-2"
            aria-label="Copy QR code as image"
            onclick={copyQrImage}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Copy QR Image
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Confirmation Dialog Modal -->
  {#if confirmDialog}
    <div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div class="modal-box" bind:this={confirmDialogRef} tabindex="-1">
        <h3 id="confirm-dialog-title" class="font-bold text-lg mb-4">Confirm Action</h3>
        <p class="py-4">{confirmDialog.message}</p>
        <div class="flex justify-end gap-2">
          <button class="btn btn-sm" aria-label="Cancel action" onclick={closeConfirm}>Cancel</button>
          <button class="btn btn-sm btn-error" aria-label="Confirm action" onclick={confirmDialog.onConfirm}>Confirm</button>
        </div>
      </div>
      <button class="modal-backdrop" aria-label="Close dialog" onclick={closeConfirm}></button>
    </div>
  {/if}

  <!-- Toast notification -->
  {#if toast}
    <div class="toast toast-center toast-bottom">
      <div class="alert alert-{toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'success'} rounded-[10px]">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          {#if toast.type === 'success'}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          {:else if toast.type === 'error'}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          {:else if toast.type === 'warning'}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          {/if}
        </svg>
        <span>{toast.message}</span>
        {#if toast.undoAction}
          <button class="btn btn-sm btn-ghost" onclick={toast.undoAction}>Undo</button>
        {/if}
      </div>
    </div>
  {/if}
  </div>
</div>
