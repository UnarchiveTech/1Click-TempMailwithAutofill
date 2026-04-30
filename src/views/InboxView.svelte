<script lang="ts">
import { browser } from 'wxt/browser';
import IconArchive from '@/components/icons/IconArchive.svelte';
import IconAutoRenew from '@/components/icons/IconAutoRenew.svelte';
import IconChevronDown from '@/components/icons/IconChevronDown.svelte';
import IconClock from '@/components/icons/IconClock.svelte';
import IconCopy from '@/components/icons/IconCopy.svelte';
import IconEnvelope from '@/components/icons/IconEnvelope.svelte';
import IconFlame from '@/components/icons/IconFlame.svelte';
import IconMail from '@/components/icons/IconMail.svelte';
import IconPlus from '@/components/icons/IconPlus.svelte';
import IconQr from '@/components/icons/IconQr.svelte';
import IconRefresh from '@/components/icons/IconRefresh.svelte';
import IconSearch from '@/components/icons/IconSearch.svelte';
import IconTag from '@/components/icons/IconTag.svelte';
import IconTrash from '@/components/icons/IconTrash.svelte';
import TagDialog from '@/components/overlays/TagDialog.svelte';
import AccountCard from '@/components/ui/account/AccountCard.svelte';
import AccountSelector from '@/components/ui/account/AccountSelector.svelte';
import ExpiryPill from '@/components/ui/ExpiryPill.svelte';
import EmailList from '@/components/ui/mail/EmailList.svelte';
import FilterList from '@/components/ui/mail/FilterList.svelte';
import {
  DEFAULT_PROVIDER,
  loadAllProviderConfigs,
  loadProviderConfig,
} from '@/services/email-service.js';
import { logError } from '@/utils/logger.js';
import { timeAgo } from '@/utils/time.js';
import type { Account, Email, SavedSearchFilter } from '@/utils/types.js';

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
  } catch {}
}

function toggleOtpDropup() {
  otpDropupOpen = !otpDropupOpen;
  if (otpDropupOpen) loadOtpHistory();
}

function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : domain;
}

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
  onRefreshInbox = () => {},
  onToggleNotifications = () => {},
  onArchiveAccount = () => {},
  onUnarchiveAccount = () => {},
  onRemoveAccount = () => {},
  onReloadAccounts = () => {},
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
  onDateFromChange = () => {},
  onDateToChange = () => {},
  onSaveFilter = () => {},
  onLoadFilter = () => {},
  onDeleteFilter = () => {},
  onNavigateToSettings = () => {},
  onNavigateToManage = () => {},
  autoRenew = false,
  onToggleAutoRenew = () => {},
} = $props<{
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
  onSelectAccount?: (address: string) => void;
  onCopyEmail?: () => void;
  onOpenQrDialog?: () => void;
  onCreateInbox?: (provider?: string, instanceId?: string) => void;
  onCreateInboxWithProvider?: (provider: string, instanceId?: string) => void;
  onAutofillForm?: () => void;
  onRefreshInbox?: () => void;
  onToggleNotifications?: () => void;
  onArchiveAccount?: (account: Account) => void;
  onUnarchiveAccount?: (account: Account) => void;
  onRemoveAccount?: (address: string) => void;
  onReloadAccounts?: () => Promise<void>;
  onEditAccount?: (account: Account) => void;
  onToggleAutoExtend?: (account: Account) => void;
  onOpenMessageDetail?: (message: Email) => void;
  onClearFilters?: () => void;
  onCopyOtp?: () => void;
  onCopyOtpFromMessage?: (otp: string) => void;
  onOpenArchivedEmails?: () => void;
  onOpenExpiredEmails?: () => void;
  onOtpOnlyChange?: (value: boolean) => void;
  onSenderDomainChange?: (value: string) => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onSaveFilter?: (name: string) => void;
  onLoadFilter?: (filter: SavedSearchFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  onNavigateToSettings?: () => void;
  onNavigateToManage?: () => void;
  autoRenew?: boolean;
  onToggleAutoRenew?: () => void;
}>();

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
    <span class="leading-tight self-center">Copy</span>
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
    onclick={() => onRemoveAccount(currentAccount.address)}
  >
    <span class="zinc-btn-icon flex items-center justify-center w-5 h-5 rounded-full shrink-0">
      <IconTrash class="w-3.5 h-3.5" />
    </span>
    <span class="leading-tight self-center">Delete</span>
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
        <span class="leading-tight self-center">Unarchive</span>
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
        <span class="leading-tight self-center">Archive</span>
      </button>
    {/if}



  {/if}

  <!-- Domain context menu -->
  {#if domainMenuOpen}
    <button class="fixed inset-0 z-40 bg-transparent cursor-default" aria-label="Close menu" onclick={() => domainMenuOpen = false}></button>
    <div 
      class="fixed z-50 bg-base-100 rounded-xl shadow-2xl border border-base-200 py-2 w-56"
      style="left: {domainMenuPosition.x}px; top: {domainMenuPosition.y}px;"
    >
      <div class="px-3 py-1.5">
        <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Guerrilla Mail</p>
      </div>
      {#each Object.values(allProviders) as provider}
        {#if !provider.multiInstance?.enabled}
          <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox(provider.id); domainMenuOpen = false; }}>
            {#if provider.ui?.icon === 'envelope'}
              <IconEnvelope class="w-4 h-4 text-orange-500" />
            {:else if provider.ui?.icon === 'flame'}
              <IconFlame class="w-4 h-4 text-blue-500" />
            {:else}
              <IconMail class="w-4 h-4 text-primary" />
            {/if}
            {provider.displayName}
          </button>
        {:else}
          <div class="border-t border-base-200 my-1"></div>
          <div class="px-3 py-1.5">
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">{provider.displayName} Instances</p>
          </div>
          {#each provider.multiInstance?.instances || [] as instance}
            <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox(provider.id, instance.id); domainMenuOpen = false; }}>
              {#if provider.ui?.icon === 'flame'}
                <IconFlame class="w-4 h-4 text-blue-500" />
              {:else}
                <IconMail class="w-4 h-4 text-primary" />
              {/if}
              {instance.displayName}
            </button>
          {/each}
        {/if}
      {/each}
      <div class="border-t border-base-200 my-1"></div>
      <button 
        class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2 text-base-content" 
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
        class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2 text-primary" 
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
          autoRenew={currentAccount.autoExtend}
          onToggleAutoRenew={() => onToggleAutoExtend(currentAccount)}
        />

        <!-- Tag pill -->
        <button
          class="flex items-center gap-1.5 cursor-pointer hover:bg-base-200 rounded-full px-2.5 py-1 bg-base-100 border border-base-400 text-left"
          onclick={openTagDialog}
          onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') openTagDialog(); }}
          aria-label="Edit tag"
        >
          <IconTag class="w-3 h-3 text-base-content/50" />
          {#if currentAccount.tag}
            <span class="text-xs text-base-content/70">{currentAccount.tag}</span>
          {:else}
            <span class="text-xs text-base-content/40 italic">Add a tag</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}



<!-- Divider before search/filter -->
<hr class="border-0 h-px my-1" style="background-color: var(--color-base-300);" />

<!-- Search + Filter row -->
<FilterList
  searchQuery={searchQuery}
  sortBy={sortBy}
  otpOnly={otpOnly}
  senderDomain={senderDomain}
  dateFrom={dateFrom}
  dateTo={dateTo}
  savedSearchFilters={savedSearchFilters}
  onSearchChange={(value: string) => searchQuery = value}
  onSortChange={(value: string) => sortBy = value}
  onOtpOnlyChange={(value: boolean) => otpOnly = value}
  onSenderDomainChange={(value: string) => senderDomain = value}
  onDateFromChange={(value: string) => dateFrom = value}
  onDateToChange={(value: string) => dateTo = value}
  onClearFilters={onClearFilters}
  onSaveFilter={onSaveFilter}
  onLoadFilter={onLoadFilter}
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

{#if formDetected}
<!-- Form Detected Container -->
<div class="px-5 py-2 border-t border-base-200 bg-success/10">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-success">Form Detected:</span>
    <button class="btn btn-xs btn-success text-white" onclick={onAutofillForm}>
      Autofill
    </button>
  </div>
</div>
{/if}

{#if latestOtp !== '------'}
<!-- OTP Container - fixed at bottom -->
<div class="border-t border-base-200 absolute bottom-0 left-0 right-0 z-10">
  {#if !otpCollapsed}
  {#if otpDropupOpen}
  <div class="border-b border-base-200" style="background: color-mix(in srgb, var(--color-primary) 5%), white);">

    <!-- Section: Current email address -->
    <div class="px-5 pt-2.5 pb-1 flex items-center justify-between">
      <span class="text-xs font-bold tracking-widest uppercase text-primary">Current Email Address</span>
      <IconChevronDown class="w-3.5 h-3.5 text-base-content/40" />
    </div>
    <div class="overflow-y-auto" style="max-height: 180px; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;">
      {#if otpHistoryCurrent.length === 0}
        <p class="text-xs text-base-content/40 px-5 pb-2">No OTPs for this inbox</p>
      {:else}
        {#each otpHistoryCurrent as item}
          <div class="flex items-center gap-3 px-5 py-2 bg-white rounded-xl mx-2 mb-2 shadow-sm">
            <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background: color-mix(in srgb, var(--color-primary) 12%), white);">
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
                <span class="text-sm font-semibold text-base-content truncate">{item.from_name || item.from}</span>
                <span class="text-xs text-base-content/40">·</span>
                <span class="text-xs text-base-content/40 flex-shrink-0">{timeAgo(item.received_at)}</span>
              </div>
              <span class="font-bold text-primary" style="font-size: 15px; letter-spacing: 0.08em;">{item.otp}</span>
            </div>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style="background: color-mix(in srgb, var(--color-primary) 12%), white);"
              aria-label="Copy"
              onclick={() => navigator.clipboard.writeText(item.otp)}
            >
              <IconCopy class="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Section: Other email addresses -->
    {#if otpHistoryOther.length > 0}
    <div class="px-5 pt-1 pb-1 flex items-center justify-between border-t border-base-200">
      <span class="text-xs font-bold tracking-widest uppercase text-primary">Other Email Addresses</span>
      <IconChevronDown class="w-3.5 h-3.5 text-base-content/40" />
    </div>
    <div class="overflow-y-auto" style="max-height: 180px; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;">
      {#each otpHistoryOther as item}
        <div class="flex items-center gap-3 px-5 py-2 bg-white rounded-xl mx-2 mb-2 shadow-sm">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background: color-mix(in srgb, var(--color-primary) 12%), white);">
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
              <span class="text-sm font-semibold text-base-content truncate">{item.from_name || item.from}</span>
              <span class="text-xs text-base-content/40">·</span>
              <span class="text-xs text-base-content/40 flex-shrink-0">{timeAgo(item.received_at)}</span>
            </div>
            <span class="font-bold text-primary" style="font-size: 15px; letter-spacing: 0.08em;">{item.otp}</span>
          </div>
          <button
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style="background: color-mix(in srgb, var(--color-primary) 12%), white);"
            aria-label="Copy"
            onclick={() => navigator.clipboard.writeText(item.otp)}
          >
            <IconCopy class="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      {/each}
    </div>
    {/if}

  </div>
  {/if}

  <div class="flex items-center gap-3 px-5 py-2.5" style="background: color-mix(in srgb, var(--color-primary) 10%), white);">

    <!-- Circular favicon -->
    <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
      {#if otpSenderEmail}
        <img
          src={getDomainFaviconUrl(otpSenderEmail)}
          alt=""
          class="w-6 h-6 object-contain"
          loading="lazy"
          onerror={(e) => {
            const img = e.target as HTMLImageElement;
            const fallback = getRootDomainFaviconUrl(otpSenderEmail);
            if (img.src !== fallback) { img.src = fallback; } else { img.style.display = 'none'; }
          }}
        />
      {/if}
    </div>

    <!-- Sender name + time -->
    <div class="flex flex-col min-w-0 flex-shrink-0" style="width: 72px;">
      <span class="text-sm font-semibold text-base-content truncate leading-tight">{latestOtpSenderName || otpSenderEmail || 'OTP'}</span>
      <span class="text-xs text-base-content/50 leading-tight mt-0.5">{otpContext.split(' | ').at(-1) || ''}</span>
    </div>

    <!-- OTP pill + copy (single solid button) -->
    <div class="flex-1 flex items-center justify-center gap-2">
      <button
        class="flex items-center gap-2 rounded-full px-4 py-2 bg-primary hover:opacity-90 transition-opacity"
        aria-label="Copy OTP"
        onclick={onCopyOtp}
      >
        <span class="font-bold text-white" style="font-size: 15px; letter-spacing: 0.08em;">{latestOtp.replace(/\s/g, '')}</span>
        <IconCopy class="w-4 h-4 text-white/80 flex-shrink-0" />
      </button>
    </div>

    <!-- Vertical divider -->
    <div class="w-px h-6 flex-shrink-0 bg-base-content/15"></div>

    <!-- Collapse button (plain icon) -->
    <button
      class="w-8 h-8 flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
      aria-label="Toggle OTP history"
      onclick={toggleOtpDropup}
    >
      <IconChevronDown class="w-4 h-4 text-base-content/50 {otpDropupOpen ? 'rotate-180' : ''}" />
    </button>

  </div>
  {:else}
  <button
    class="w-full flex items-center justify-between px-5 py-1.5 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
    style="background: color-mix(in srgb, var(--color-primary) 5%, white);"
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
