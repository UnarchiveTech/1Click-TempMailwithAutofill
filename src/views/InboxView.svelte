<script lang="ts">
import { t } from 'svelte-i18n';
import { browser } from 'wxt/browser';
import IconArchive from '@/components/icons/IconArchive.svelte';
import IconAutoRenew from '@/components/icons/IconAutoRenew.svelte';
import IconChevronDown from '@/components/icons/IconChevronDown.svelte';
import IconChevronUp from '@/components/icons/IconChevronUp.svelte';
import IconClock from '@/components/icons/IconClock.svelte';
import IconCopy from '@/components/icons/IconCopy.svelte';
import IconEnvelope from '@/components/icons/IconEnvelope.svelte';
import IconFlame from '@/components/icons/IconFlame.svelte';
import IconGlobe from '@/components/icons/IconGlobe.svelte';
import IconMail from '@/components/icons/IconMail.svelte';
import IconPlus from '@/components/icons/IconPlus.svelte';
import IconQr from '@/components/icons/IconQr.svelte';
import IconRefresh from '@/components/icons/IconRefresh.svelte';
import IconSearch from '@/components/icons/IconSearch.svelte';
import IconShield from '@/components/icons/IconShield.svelte';
import IconTag from '@/components/icons/IconTag.svelte';
import IconTrash from '@/components/icons/IconTrash.svelte';
import IconX from '@/components/icons/IconX.svelte';
import TagDialog from '@/components/overlays/TagDialog.svelte';
import AccountCard from '@/components/ui/account/AccountCard.svelte';
import AccountSelector from '@/components/ui/account/AccountSelector.svelte';
import ExpiryPill from '@/components/ui/ExpiryPill.svelte';
import EmailList from '@/components/ui/mail/EmailList.svelte';
import FilterList from '@/components/ui/mail/FilterList.svelte';
import TagPill from '@/components/ui/TagPill.svelte';
import {
  getSelectedIdentity,
  loadIdentities,
  selectIdentity,
} from '@/features/identities/identity-actions.js';
import {
  DEFAULT_PROVIDER,
  loadAllProviderConfigs,
  loadProviderConfig,
} from '@/utils/email-service.js';
import { logError } from '@/utils/logger.js';
import { timeAgo } from '@/utils/time.js';
import type { Account, Email, Identity, SavedSearchFilter } from '@/utils/types.js';

let otpCollapsed = $state(false);
let otpDropupOpen = $state(false);

type OtpHistoryItem = {
  otp: string;
  from: string;
  from_name: string;
  received_at: number;
  inboxAddress: string;
};

let otpHistoryCurrent = $state<OtpHistoryItem[]>([]);
let otpHistoryOther = $state<OtpHistoryItem[]>([]);

// Identity state
let identities = $state<Identity[]>([]);
let selectedIdentityId = $state<string | null>(null);
let showAutofillStrip = $state(true);
let currentDomain = $state<string>('');
let showIdentityDropdown = $state(false);

// Load all providers dynamically from config
let allProviders = $derived.by(() => loadAllProviderConfigs());

async function loadOtpHistory() {
  try {
    const { storedEmails = {} } = (await browser.storage.local.get(['storedEmails'])) as {
      storedEmails?: Record<string, Email[]>;
    };
    const current: OtpHistoryItem[] = [];
    const other: OtpHistoryItem[] = [];
    for (const [addr, msgs] of Object.entries(storedEmails)) {
      for (const m of msgs) {
        if (!m.otp) continue;
        const item: OtpHistoryItem = {
          otp: m.otp,
          from:
            (m as Email & { from_address?: string }).from_address || m.from || m.from_name || '',
          from_name: m.from_name || '',
          received_at: m.received_at,
          inboxAddress: addr,
        };
        if (addr === selectedEmail) {
          current.push(item);
        } else {
          other.push(item);
        }
      }
    }
    current.sort((a, b) => b.received_at - a.received_at);
    other.sort((a, b) => b.received_at - a.received_at);
    otpHistoryCurrent = current;
    otpHistoryOther = other;
  } catch (error: unknown) {
    logError(
      'Failed to load OTP history:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

function toggleOtpDropup() {
  otpDropupOpen = !otpDropupOpen;
  if (otpDropupOpen) loadOtpHistory();
}

function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : domain;
}

async function loadIdentitiesData() {
  try {
    const { identities: storedIdentities = [], selectedIdentityId: storedSelectedId } =
      (await browser.storage.local.get(['identities', 'selectedIdentityId'])) as {
        identities?: Identity[];
        selectedIdentityId?: string;
      };

    identities = storedIdentities;
    selectedIdentityId = storedSelectedId || storedIdentities[0]?.id || null;
  } catch (error: unknown) {
    logError(
      'Failed to load identities:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

async function handleIdentityChange() {
  if (selectedIdentityId) {
    await browser.storage.local.set({ selectedIdentityId });
  }
}

// Load identities on mount
loadIdentitiesData();

// Get current tab domain
async function getCurrentTabDomain() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
    }
  } catch (error: unknown) {
    logError(
      'Failed to get current tab domain:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

getCurrentTabDomain();

function getDomainFaviconUrl(sender: string): string {
  const domain = sender.split('@')[1] || sender;
  return `https://${domain}/favicon.ico`;
}

function getRootDomainFaviconUrl(sender: string): string {
  const domain = sender.split('@')[1] || sender;
  const root = getRootDomain(domain);
  return `https://${root}/favicon.ico`;
}

function formatOtp(otp: string): string {
  const clean = otp.replace(/\s/g, '');
  if (clean.length === 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  if (clean.length === 8) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  return otp;
}

let {
  context = 'popup',
  selectedEmail = '',
  accounts = [],
  allAccounts = [],
  loading = false,
  searchQuery = '',
  sortBy = 'newest',
  otpOnly = false,
  senderDomain = '',
  selectedSenders = [] as string[],
  dateFrom = '',
  dateTo = '',
  notificationsEnabled = false,
  filteredEmails = [],
  emails = [],
  latestOtp = '------',
  latestOtpSender = '',
  latestOtpSenderName = '',
  otpContext = '',
  formDetected = false,
  savedSearchFilters = [],
  onSelectAccount = () => {},
  onCopyEmail = () => {},
  onOpenQrDialog = () => {},
  onCreateInbox = () => {},
  onAutofillForm = () => {},
  onRefreshInbox = async () => {},
  onToggleNotifications = () => {},
  onArchiveAccount = () => {},
  onUnarchiveAccount = () => {},
  onRemoveAccount = () => {},
  onReloadAccounts = async () => {},
  onEditAccount = () => {},
  onToggleAutoExtend = () => {},
  onOpenMessageDetail = () => {},
  onClearFilters = () => {},
  onCopyOtp = () => {},
  onCopyOtpFromMessage = () => {},
  onOpenArchivedEmails = () => {},
  onOpenExpiredEmails = () => {},
  onOtpOnlyChange = () => {},
  onSenderDomainChange = () => {},
  onSelectedSendersChange = (_v: string[]) => {},
  onDateFromChange = () => {},
  onDateToChange = () => {},
  onSaveFilter = (_name: string) => {},
  onLoadFilter = (_filter: SavedSearchFilter) => {},
  onRenameFilter = (_id: string, _name: string) => {},
  onDeleteFilter = (_id: string) => {},
  onNavigateToSettings = () => {},
  onNavigateToManage = () => {},
  autoRenew = false,
  onToggleAutoRenew = () => {},
  dropdownOpen = undefined,
  openSection = undefined,
  onDropdownOpenChange = (_open: boolean) => {},
  showToast = (_message: string) => {},
}: {
  context?: 'popup' | 'sidepanel' | 'app';
  selectedEmail?: string;
  dropdownOpen?: boolean;
  accounts?: Account[];
  allAccounts?: Account[];
  loading?: boolean;
  searchQuery?: string;
  sortBy?: string;
  otpOnly?: boolean;
  senderDomain?: string;
  selectedSenders?: string[];
  dateFrom?: string;
  dateTo?: string;
  notificationsEnabled?: boolean;
  filteredEmails?: Email[];
  emails?: Email[];
  latestOtp?: string;
  latestOtpSender?: string;
  latestOtpSenderName?: string;
  otpContext?: string;
  formDetected?: boolean;
  savedSearchFilters?: SavedSearchFilter[];
  onSelectAccount?: (email: string) => void;
  onCopyEmail?: () => void;
  onOpenQrDialog?: () => void;
  onCreateInbox?: (provider?: string, instanceId?: string) => void;
  onAutofillForm?: () => void;
  onRefreshInbox?: () => Promise<void>;
  onToggleNotifications?: () => void;
  onArchiveAccount?: (account: Account) => void;
  onUnarchiveAccount?: (account: Account) => void;
  onRemoveAccount?: (address: string) => void;
  onReloadAccounts?: () => Promise<void>;
  onEditAccount?: (account: Account) => void;
  onToggleAutoExtend?: (account: Account) => void;
  onOpenMessageDetail?: (message: Email) => void;
  onClearFilters?: () => void | Promise<void>;
  onCopyOtp?: () => void;
  onCopyOtpFromMessage?: (otp: string) => void;
  onOpenArchivedEmails?: () => void;
  onOpenExpiredEmails?: () => void;
  onOtpOnlyChange?: (v: boolean) => void;
  onSenderDomainChange?: (v: string) => void;
  onSelectedSendersChange?: (v: string[]) => void;
  onDateFromChange?: (v: string) => void;
  showToast?: (message: string) => void;
  onDateToChange?: (v: string) => void;
  onSaveFilter?: (name: string) => void;
  onLoadFilter?: (filter: SavedSearchFilter) => void;
  onRenameFilter?: (id: string, name: string) => void;
  onDeleteFilter?: (id: string) => void;
  onNavigateToSettings?: () => void | Promise<void>;
  onNavigateToManage?: () => void | Promise<void>;
  autoRenew?: boolean;
  onToggleAutoRenew?: () => void;
  openSection?: 'active' | 'archived' | 'expired' | null;
  onDropdownOpenChange?: (open: boolean) => void;
} = $props();

let otpSenderEmail = $derived(
  emails
    .filter((e: Email) => e.otp && e.from)
    .sort((a: Email, b: Email) => b.received_at - a.received_at)[0]?.from ?? latestOtpSender
);

// Context menu state (for domain selection)
let domainMenuOpen = $state(false);
let domainMenuPosition = $state({ x: 0, y: 0 });

// Tag editing state
let tagDialogOpen = $state(false);
let tagTargetAccount = $state<Account | null>(null);

// Lazy loading state
let displayedEmailCount = $state(20);
const BATCH_SIZE = 20;

// Displayed emails for lazy loading
let displayedEmails = $derived.by(() => {
  return filteredEmails.slice(0, displayedEmailCount);
});

// Load more emails when scrolling near bottom
function loadMoreEmails() {
  if (displayedEmailCount < filteredEmails.length) {
    displayedEmailCount = Math.min(displayedEmailCount + BATCH_SIZE, filteredEmails.length);
  }
}

// Reactive derived value for current account
let currentAccount = $derived.by(() => {
  if (!selectedEmail) return null;
  return allAccounts.find((a: Account) => a.address === selectedEmail) || null;
});

// Calculate expiry progress percentage
let expiryProgress = $derived.by(() => {
  if (!currentAccount?.expiresAt || !currentAccount.createdAt) return 0;
  const now = Date.now();
  const totalDuration = currentAccount.expiresAt - currentAccount.createdAt;
  const remaining = currentAccount.expiresAt - now;
  if (totalDuration <= 0) return 0;
  const percentage = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  return percentage;
});

// Calculate expiry time in minutes for ExpiryPill
let expiryTimeMinutes = $derived.by(() => {
  if (!currentAccount?.expiresAt) return 0;
  const now = Date.now();
  const remainingMs = currentAccount.expiresAt - now;
  return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
});

// Tag functions
async function updateTag(accountId: string, tag: string, color?: string) {
  try {
    await browser.runtime.sendMessage({ type: 'updateInboxTag', inboxId: accountId, tag, color });
    await onReloadAccounts();
  } catch (e) {
    logError('Failed to update tag:', e);
  }
}

function openTagDialog() {
  if (!currentAccount) return;
  tagTargetAccount = currentAccount;
  tagDialogOpen = true;
}

function closeTagDialog() {
  tagDialogOpen = false;
  tagTargetAccount = null;
}

function saveTag(tag: string, color: string) {
  if (!tagTargetAccount) return;
  updateTag(tagTargetAccount.id, tag, color);
  closeTagDialog();
}

// Extract existing tags from all accounts
let existingTags = $derived.by(() => {
  const tags = new Set<string>();
  allAccounts.forEach((a: Account) => {
    if (a.tag) tags.add(a.tag);
  });
  return Array.from(tags);
});

// Extract tag colors from all accounts
let tagColors = $derived.by(() => {
  const colors: Record<string, string> = {};
  allAccounts.forEach((a: Account) => {
    if (a.tag && a.tagColor) {
      colors[a.tag] = a.tagColor;
    }
  });
  return colors;
});
</script>

<div class="relative flex flex-col h-full">
<AccountSelector
  {selectedEmail}
  {accounts}
  {allAccounts}
  {dropdownOpen}

  {onDropdownOpenChange}
  onSelectAccount={onSelectAccount}
  onEditAccount={onEditAccount}
  onToggleAutoExtend={onToggleAutoExtend}
  onArchiveAccount={onArchiveAccount}
  onUnarchiveAccount={onUnarchiveAccount}
  onRemoveAccount={onRemoveAccount}
  onCreateInbox={onCreateInbox}
  onNavigateToManage={onNavigateToManage}
  onReloadAccounts={onReloadAccounts}
  onNavigateToSettings={onNavigateToSettings}
  onCreateInboxWithProvider={onCreateInbox}
  {showToast}
/>

<!-- Action row: Copy Email, QR, New Address, Refresh, Notifications -->
<div class="flex items-center gap-1.5 px-1 pt-2 pb-2">
  <!-- Copy Email -->
  <button
    class="zinc-btn-copy flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl font-bold text-[11px] tracking-wide transition-colors shadow-sm"
    aria-label="Copy email address"
    onclick={onCopyEmail}
  >
    <span class="zinc-btn-icon flex items-center justify-center w-5 h-5 rounded-full shrink-0">
      <IconCopy class="w-3.5 h-3.5" />
    </span>
    <span class="leading-tight self-center">{$t('common.copy')}</span>
  </button>

  <!-- QR Code -->
  <button
    class="zinc-btn-qr flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl font-bold text-[11px] tracking-wide transition-colors shadow-sm"
    aria-label="Show QR code"
    onclick={onOpenQrDialog}
  >
    <span class="zinc-btn-icon flex items-center justify-center w-5 h-5 rounded-full shrink-0">
      <IconQr class="w-3.5 h-3.5" />
    </span>
    <span class="leading-tight self-center">QR</span>
  </button>

  <!-- Forget Me -->
  <button
    class="zinc-btn-forget flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl font-bold text-[11px] tracking-wide transition-colors shadow-sm"
    aria-label="Delete email address"
    onclick={() => currentAccount && onRemoveAccount(currentAccount.address)}
  >
    <span class="zinc-btn-icon flex items-center justify-center w-5 h-5 rounded-full shrink-0">
      <IconTrash class="w-3.5 h-3.5" />
    </span>
    <span class="leading-tight self-center">{$t('common.delete')}</span>
  </button>

  <!-- Archive/Unarchive -->
  {#if currentAccount}
    {#if currentAccount.archived}
      <button
        class="zinc-btn-archive flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl font-bold text-[11px] tracking-wide transition-colors shadow-sm"
        aria-label="Unarchive email"
        onclick={() => onUnarchiveAccount(currentAccount)}
      >
        <span class="zinc-btn-icon-inv flex items-center justify-center w-5 h-5 rounded-full shrink-0">
          <IconArchive class="w-3.5 h-3.5" />
        </span>
        <span class="leading-tight self-center">{$t('common.unarchive')}</span>
      </button>
    {:else}
      <button
        class="zinc-btn-archive flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl font-bold text-[11px] tracking-wide transition-colors shadow-sm"
        aria-label="Archive email"
        onclick={() => onArchiveAccount(currentAccount)}
      >
        <span class="zinc-btn-icon-inv flex items-center justify-center w-5 h-5 rounded-full shrink-0">
          <IconArchive class="w-3.5 h-3.5" />
        </span>
        <span class="leading-tight self-center">{$t('common.archive')}</span>
      </button>
    {/if}
  {/if}

  <!-- Domain context menu -->
  {#if domainMenuOpen}
    <button class="fixed inset-0 z-40 bg-transparent cursor-default" aria-label="Close menu" onclick={() => domainMenuOpen = false}></button>
    <div 
      class="fixed z-50 bg-md-primary-container rounded-xl shadow-2xl border border-md-secondary-container py-2 w-56"
      style="left: {domainMenuPosition.x}px; top: {domainMenuPosition.y}px;"
    >
      <div class="px-3 py-1.5">
        <p class="text-xs font-semibold text-md-on-surface/50 uppercase tracking-wider">Guerrilla Mail</p>
      </div>
      {#each Object.values(allProviders) as provider}
        {#if !provider.multiInstance?.enabled}
          <button class="w-full px-4 py-2 text-left hover:bg-md-secondary-container text-sm flex items-center gap-2" onclick={() => { onCreateInbox(provider.id); domainMenuOpen = false; }}>
            {#if provider.ui?.icon === 'envelope'}
              <IconEnvelope class="w-4 h-4 text-md-warning" />
            {:else if provider.ui?.icon === 'flame'}
              <IconFlame class="w-4 h-4 text-md-primary" />
            {:else}
              <IconMail class="w-4 h-4 text-md-primary" />
            {/if}
            {provider.displayName}
          </button>
        {:else}
          <div class="border-t border-md-secondary-container my-1"></div>
          <div class="px-3 py-1.5">
            <p class="text-xs font-semibold text-md-on-surface/50 uppercase tracking-wider">{provider.displayName} Instances</p>
          </div>
          {#each provider.multiInstance?.instances || [] as instance}
            <button class="w-full px-4 py-2 text-left hover:bg-md-secondary-container text-sm flex items-center gap-2" onclick={() => { onCreateInbox(provider.id, instance.id); domainMenuOpen = false; }}>
              {#if provider.ui?.icon === 'flame'}
                <IconFlame class="w-4 h-4 text-md-primary" />
              {:else}
                <IconMail class="w-4 h-4 text-md-primary" />
              {/if}
              {instance.displayName}
            </button>
          {/each}
        {/if}
      {/each}
      <div class="border-t border-md-secondary-container my-1"></div>
      <button 
        class="w-full px-4 py-2 text-left hover:bg-md-secondary-container text-sm flex items-center gap-2 text-md-on-surface" 
        onclick={() => { 
          domainMenuOpen = false; 
          onNavigateToSettings();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 9.18a23.848 23.848 0 00-8.835 2.535M10.34 6.66a23.847 23.847 0 00-8.835-2.535" />
        </svg>
        Manage Instances
      </button>
      <button 
        class="w-full px-4 py-2 text-left hover:bg-md-secondary-container text-sm flex items-center gap-2 text-md-primary" 
        onclick={() => { 
          domainMenuOpen = false; 
          onNavigateToSettings();
        }}
      >
        <IconPlus class="w-5 h-5" />
        Add Custom Instance...
      </button>
    </div>
  {/if}
</div>

<!-- Tag and expiry row -->
{#if currentAccount}
    <div class="px-3 pb-0.5 pt-1">
      <div class="flex items-center gap-2">
        <!-- Expiry pill -->
        <ExpiryPill
          expiryTime={expiryTimeMinutes}
          autoRenew={currentAccount.autoExtend || false}
          onToggleAutoRenew={() => onToggleAutoExtend(currentAccount)}
        />

        <!-- Tag pill -->
        <TagPill
          tag={currentAccount.tag}
          tagColor={currentAccount.tagColor}
          onClick={openTagDialog}
          showIcon={true}
        />
      </div>
    </div>
  {/if}



<!-- Divider before search/filter -->
<hr class="border-0 h-px my-1" style="background-color: var(--md-secondary-container);" />

<!-- Search + Filter row -->
<FilterList
  searchQuery={searchQuery}
  sortBy={sortBy}
  otpOnly={otpOnly}
  senderDomain={senderDomain}
  selectedSenders={selectedSenders}
  emails={emails}
  dateFrom={dateFrom}
  dateTo={dateTo}
  savedSearchFilters={savedSearchFilters}
  onSearchChange={(value: string) => searchQuery = value}
  onSortChange={(value: string) => sortBy = value}
  onOtpOnlyChange={(value: boolean) => otpOnly = value}
  onSenderDomainChange={(value: string) => senderDomain = value}
  onSelectedSendersChange={(value: string[]) => { selectedSenders = value; onSelectedSendersChange(value); }}
  onDateFromChange={(value: string) => dateFrom = value}
  onDateToChange={(value: string) => dateTo = value}
  onClearFilters={onClearFilters}
  onSaveFilter={async (name: string) => {
    await onSaveFilter(name);
  }}
  onLoadFilter={onLoadFilter}
  onRenameFilter={onRenameFilter}
  onDeleteFilter={onDeleteFilter}
  onRefreshInbox={onRefreshInbox}
  onToggleNotifications={onToggleNotifications}
  notificationsEnabled={notificationsEnabled}
/>

<!-- Email list -->
<EmailList
  displayedEmails={displayedEmails}
  filteredEmails={filteredEmails}
  displayedEmailCount={displayedEmailCount}
  {loading}
  {searchQuery}
  {otpOnly}
  onOpenMessageDetail={onOpenMessageDetail}
  onClearFilters={onClearFilters}
  onRefreshInbox={onRefreshInbox}
  onCopyOtpFromMessage={onCopyOtpFromMessage}
  loadMoreEmails={loadMoreEmails}
/>

{#if formDetected && showAutofillStrip}
<!-- Form Detected Container -->
<div class="px-3 border-t border-md-primary bg-md-primary-container absolute bottom-0 left-0 right-0 z-20" style="min-height: 56px; display: flex; align-items: center;">
  <div class="flex items-center gap-2 w-full">
    <!-- Favicon + Domain -->
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-md-secondary-container flex items-center justify-center overflow-hidden">
        {#if currentDomain}
          <img
            src={`https://www.google.com/s2/favicons?sz=24&domain=${currentDomain}`}
            alt=""
            class="w-4 h-4"
            onerror={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              if (img.parentElement) {
                const icon = document.createElement('div');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                if (icon.firstChild) {
                  img.parentElement.appendChild(icon.firstChild!);
                }
              }
            }}
          />
        {:else}
          <IconGlobe class="w-4 h-4 opacity-40" />
        {/if}
      </div>
      <div class="min-w-0">
        <div class="text-xs font-bold text-md-secondary leading-tight truncate max-w-[80px]">{currentDomain || 'Unknown'}</div>
        <div class="text-[9px] font-semibold uppercase tracking-wider text-md-tertiary leading-tight">Detected Form</div>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-px h-6 bg-md-secondary-container flex-shrink-0 mx-1"></div>

    <!-- Identity Selector -->
    <div class="relative flex-1 min-w-0">
      <div 
        class="flex items-center gap-1 bg-md-secondary-container/70 rounded-full px-2.5 py-1 cursor-pointer relative" 
        role="button"
        tabindex="0"
        onclick={() => showIdentityDropdown = !showIdentityDropdown}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showIdentityDropdown = !showIdentityDropdown;
          }
        }}
      >
        <IconShield class="w-3 h-3 text-md-secondary flex-shrink-0" />
        <div class="flex-1 min-w-0 text-[11px] font-medium text-md-on-surface pr-2 truncate">
          {identities.find(i => i.id === selectedIdentityId)?.name || $t('identities.select')}
        </div>
        <IconChevronDown class="w-2.5 h-2.5 text-md-on-surface/40 flex-shrink-0 transition-transform {showIdentityDropdown ? 'rotate-180' : ''}" />
        
        <!-- Dropup Menu -->
        {#if showIdentityDropdown}
          <div class="absolute bottom-full left-0 right-0 mb-1 bg-md-primary-container border border-md-secondary-container rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: var(--md-primary) transparent;">
            {#each identities as identity}
              <button
                class="w-full text-left px-3 py-2 text-[11px] font-medium text-md-on-surface hover:bg-md-secondary-container transition-colors first:rounded-t-xl last:rounded-b-xl"
                onclick={(e) => { e.stopPropagation(); selectedIdentityId = identity.id; handleIdentityChange(); showIdentityDropdown = false; }}
              >
                {identity.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Autofill Button -->
    <button class="px-3 py-1 rounded-full text-[11px] font-semibold rounded-lg bg-md-primary text-md-on-primary hover:bg-md-primary/90 flex-shrink-0 transition-colors" onclick={onAutofillForm}>
      Autofill
    </button>

    <!-- Close Button -->
    <button class="w-5 h-5 flex items-center justify-center rounded-lg bg-transparent hover:bg-md-secondary-container flex-shrink-0 ml-0.5 transition-colors" onclick={() => showAutofillStrip = false} aria-label="Close">
      <IconX class="w-3 h-3" />
    </button>
  </div>
</div>
{/if}

{#if latestOtp !== '------'}
<!-- OTP Container - fixed at bottom -->
<div class="border-t border-md-primary absolute {formDetected && showAutofillStrip ? 'bottom-14' : 'bottom-0'} left-0 right-0 z-10 transition-all duration-200">
  {#if !otpCollapsed}
  {#if otpDropupOpen}
  <div class="border-b border-md-primary bg-md-primary-container">

    <!-- Section: Current email address -->
    <div class="px-5 pt-2.5 pb-1 flex items-center justify-between">
      <span class="text-xs font-bold tracking-widest uppercase text-md-primary">{$t('inbox.currentEmail')}</span>
      <IconChevronDown class="w-3.5 h-3.5 text-md-on-surface/40" />
    </div>
    <div class="overflow-y-auto" style="max-height: 180px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--md-outline, #75777f) 0.2, transparent) transparent;">
      {#if otpHistoryCurrent.length === 0}
        <p class="text-xs text-md-on-surface/40 px-5 pb-2">{$t('inbox.noOtps')}</p>
      {:else}
        {#each otpHistoryCurrent as item}
          <div class="flex items-center gap-3 px-5 py-2 bg-white rounded-xl mx-2 mb-2 shadow-sm">
            <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background: color-mix(in srgb, var(--md-primary) 12%), white);">
              {#if item.from}
                <img
                  src={getDomainFaviconUrl(item.from)}
                  alt=""
                  class="w-6 h-6 object-contain"
                  loading="lazy"
                  onerror={(e) => {
                    const img = e.target as HTMLImageElement;
                    const fb = getRootDomainFaviconUrl(item.from);
                    if (img.src !== fb) { img.src = fb; } else { img.style.display = 'none'; }
                  }}
                />
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-semibold text-md-on-surface truncate">{item.from_name || item.from}</span>
                <span class="text-xs text-md-on-surface/40">·</span>
                <span class="text-xs text-md-on-surface/40 flex-shrink-0">{timeAgo(item.received_at)}</span>
              </div>
              <span class="font-bold text-md-primary" style="font-size: 15px; letter-spacing: 0.08em;">{item.otp}</span>
            </div>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style="background: color-mix(in srgb, var(--md-primary) 12%), white);"
              aria-label="Copy"
              onclick={() => navigator.clipboard.writeText(item.otp)}
            >
              <IconCopy class="w-3.5 h-3.5 text-md-primary" />
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Section: Other email addresses -->
    {#if otpHistoryOther.length > 0}
    <div class="px-5 pt-1 pb-1 flex items-center justify-between border-t border-md-secondary-container">
      <span class="text-xs font-bold tracking-widest uppercase text-md-primary">{$t('inbox.otherEmails')}</span>
      <IconChevronDown class="w-3.5 h-3.5 text-md-on-surface/40" />
    </div>
    <div class="overflow-y-auto" style="max-height: 180px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--md-outline, #75777f) 0.2, transparent) transparent;">
      {#each otpHistoryOther as item}
        <div class="flex items-center gap-3 px-5 py-2 bg-white rounded-xl mx-2 mb-2 shadow-sm">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background: color-mix(in srgb, var(--md-primary) 12%), white);">
            {#if item.from}
              <img
                src={getDomainFaviconUrl(item.from)}
                alt=""
                class="w-6 h-6 object-contain"
                loading="lazy"
                onerror={(e) => {
                  const img = e.target as HTMLImageElement;
                  const fb = getRootDomainFaviconUrl(item.from);
                  if (img.src !== fb) { img.src = fb; } else { img.style.display = 'none'; }
                }}
              />
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-md-on-surface truncate">{item.from_name || item.from}</span>
              <span class="text-xs text-md-on-surface/40">·</span>
              <span class="text-xs text-md-on-surface/40 flex-shrink-0">{timeAgo(item.received_at)}</span>
            </div>
            <span class="font-bold text-md-primary" style="font-size: 15px; letter-spacing: 0.08em;">{item.otp}</span>
          </div>
          <button
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style="background: color-mix(in srgb, var(--md-primary) 12%), white);"
            aria-label="Copy"
            onclick={() => navigator.clipboard.writeText(item.otp)}
          >
            <IconCopy class="w-3.5 h-3.5 text-md-primary" />
          </button>
        </div>
      {/each}
    </div>
    {/if}

  </div>
  {/if}

  <div class="flex items-center gap-2 px-3" style="background: color-mix(in srgb, var(--md-primary) 10%), white); min-height: 56px;">

    <!-- Favicon + Domain + Detected OTP -->
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden">
        {#if otpSenderEmail}
          <img
            src={getDomainFaviconUrl(otpSenderEmail)}
            alt=""
            class="w-4 h-4"
            loading="lazy"
            onerror={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = getRootDomainFaviconUrl(otpSenderEmail);
              if (img.src !== fallback) { img.src = fallback; } else { img.style.display = 'none'; }
            }}
          />
        {/if}
      </div>
      <div class="min-w-0">
        <div class="text-xs font-bold text-md-on-surface leading-tight truncate max-w-[80px]">{latestOtpSenderName || otpSenderEmail?.split('@')[0] || 'OTP'}</div>
        <div class="text-[9px] font-semibold uppercase tracking-wider text-md-on-surface/40 leading-tight">Detected OTP ({otpContext.split(' | ').pop() || 'just now'})</div>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-px h-6 bg-md-secondary-container flex-shrink-0 mx-1"></div>

    <!-- Current OTP with Copy -->
    <div class="flex-1 flex items-center justify-center">
      <button
        class="px-3 py-1 rounded-full text-[11px] font-semibold rounded-lg bg-md-primary text-md-on-primary hover:bg-md-primary/90 flex-shrink-0 flex items-center gap-1.5 transition-colors"
        aria-label="Copy OTP"
        onclick={onCopyOtp}
      >
        <span class="font-bold" style="font-size: 13px; letter-spacing: 0.05em;">{latestOtp.replace(/\s/g, '')}</span>
        <IconCopy class="w-3 h-3 text-white/80 flex-shrink-0" />
      </button>
    </div>

    <!-- Up/Down Buttons -->
    <div class="flex items-center gap-1 flex-shrink-0 ml-0.5">
      <button
        class="w-5 h-5 flex items-center justify-center rounded-lg bg-transparent hover:bg-md-secondary-container transition-colors"
        aria-label={otpDropupOpen ? "Collapse OTP history" : "Expand OTP history"}
        onclick={toggleOtpDropup}
      >
        {#if otpDropupOpen}
          <IconChevronUp class="w-3 h-3" />
        {:else}
          <IconChevronDown class="w-3 h-3" />
        {/if}
      </button>
      <button
        class="w-5 h-5 flex items-center justify-center rounded-lg bg-transparent hover:bg-md-secondary-container transition-colors"
        aria-label="Collapse OTP"
        onclick={() => { otpCollapsed = true; }}
      >
        <IconChevronUp class="w-3 h-3" />
      </button>
    </div>

  </div>
  {:else}
  <button
    class="w-full flex items-center justify-between px-5 py-1.5 text-xs font-medium text-md-primary/70 hover:text-md-primary transition-colors bg-md-primary-container"
    onclick={() => { otpCollapsed = false; }}
    aria-label="Show OTP bar"
  >
    <span>OTP ready · {latestOtp}</span>
    <IconChevronDown class="w-3.5 h-3.5" />
  </button>
  {/if}
</div>
{/if}

<!-- Tag Dialog -->
<TagDialog
  open={tagDialogOpen}
  currentTag={tagTargetAccount?.tag || null}
  currentTagColor={tagTargetAccount?.tagColor || null}
  existingTags={existingTags}
  tagColors={tagColors}
  onClose={closeTagDialog}
  onSave={saveTag}
/>
</div>
