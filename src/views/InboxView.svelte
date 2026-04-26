<script lang="ts">
import { browser } from 'wxt/browser';
import IconArchive from '@/components/icons/IconArchive.svelte';
import IconAutoRenew from '@/components/icons/IconAutoRenew.svelte';
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
import EmailList from '@/components/ui/mail/EmailList.svelte';
import FilterList from '@/components/ui/mail/FilterList.svelte';
import { logError } from '@/utils/logger.js';
import type { Account, Email, SavedSearchFilter } from '@/utils/types.js';

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
  onExtendAccount = () => {},
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
  onExtendAccount?: (account: Account) => void;
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
}>();

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

// Tag functions
async function updateTag(accountId: string, tag: string) {
  try {
    await browser.runtime.sendMessage({ type: 'updateInboxTag', inboxId: accountId, tag });
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

function saveTag(tag: string) {
  if (!tagTargetAccount) return;
  updateTag(tagTargetAccount.id, tag);
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
</script>

<AccountSelector
  {selectedEmail}
  {accounts}
  {allAccounts}
  onSelectAccount={onSelectAccount}
  onEditAccount={onEditAccount}
  onExtendAccount={onExtendAccount}
  onArchiveAccount={onArchiveAccount}
  onUnarchiveAccount={onUnarchiveAccount}
  onRemoveAccount={onRemoveAccount}
  onCreateInbox={onCreateInbox}
  onNavigateToManage={onNavigateToManage}
  onReloadAccounts={onReloadAccounts}
  onNavigateToSettings={onNavigateToSettings}
  onCreateInboxWithProvider={onCreateInbox}
/>

<!-- Tag and expiry row -->
{#if currentAccount}
    <div class="px-2 pb-0.5">
      <div class="flex items-center gap-2">
        <!-- Expiry pill -->
        <div class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1" style="padding: 2px;">
          <div class="absolute inset-0 rounded-full" style="background: conic-gradient(from -45deg, #22c55e 0%, #22c55e {expiryProgress}%, #ef4444 {expiryProgress}%, #ef4444 100%);"></div>
          <div class="relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 {currentAccount.autoExtend ? 'bg-primary/10' : currentAccount.status === 'expired' ? 'bg-error/10' : 'bg-base-100'}">
            <IconClock class="w-3 h-3 {currentAccount.autoExtend ? 'text-primary' : currentAccount.status === 'expired' ? 'text-error' : 'text-base-content/50'}" />
            <span class="text-xs {currentAccount.autoExtend ? 'text-primary' : currentAccount.status === 'expired' ? 'text-error' : 'text-base-content/50'}">{currentAccount.expiry}</span>
          </div>
        </div>

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

<!-- Action row: Copy Email, QR, New Address, Refresh, Notifications -->
<div class="flex items-center gap-2 px-2 pt-1 pb-1">
  <!-- Copy Email wide button -->
  <button
    class="btn btn-primary btn-sm flex-1 gap-2 font-semibold rounded-xl"
    aria-label="Copy email address"
    onclick={onCopyEmail}
  >
    <IconCopy class="w-4 h-4" />
    Copy Email
  </button>

  <!-- QR button -->
  <button
    class="btn btn-sm btn-square rounded-xl bg-primary/10 hover:bg-primary/20 border-0 tooltip tooltip-bottom"
    data-tip="QR Code"
    aria-label="Show QR code"
    onclick={onOpenQrDialog}
  >
    <IconQr class="w-5 h-5 text-primary" />
  </button>

  <!-- Archive/Unarchive button -->
  {#if currentAccount}
    {#if currentAccount.archived}
      <button
        class="btn btn-sm btn-square rounded-xl bg-success/10 hover:bg-success/20 border-0 tooltip tooltip-bottom text-success"
        data-tip="Unarchive"
        aria-label="Unarchive email"
        onclick={() => onUnarchiveAccount(currentAccount)}
      >
        <IconArchive class="w-5 h-5" />
      </button>
    {:else}
      <button
        class="btn btn-sm btn-square rounded-xl bg-warning/10 hover:bg-warning/20 border-0 tooltip tooltip-bottom text-warning"
        data-tip="Archive"
        aria-label="Archive email"
        onclick={() => onArchiveAccount(currentAccount)}
      >
        <IconArchive class="w-5 h-5" />
      </button>
    {/if}

    <!-- Delete button -->
    <button
      class="btn btn-sm btn-square rounded-xl bg-error/10 hover:bg-error/20 border-0 tooltip tooltip-bottom text-error"
      data-tip="Delete"
      aria-label="Delete email"
      onclick={() => onRemoveAccount(currentAccount.address)}
    >
      <IconTrash class="w-5 h-5" />
    </button>

    <!-- Auto-renewal button (only for Guerrilla Mail) -->
    {#if currentAccount.provider === 'guerrilla'}
      <button
        class="btn btn-sm btn-square rounded-xl {currentAccount.autoExtend ? 'bg-primary/10 hover:bg-primary/20 text-primary' : 'bg-base-200 hover:bg-base-300 text-base-content/60'} border-0 tooltip tooltip-left"
        data-tip={currentAccount.autoExtend ? 'Auto-renewal enabled' : 'Enable auto-renewal'}
        aria-label="Toggle auto-renewal"
        onclick={() => onExtendAccount(currentAccount)}
      >
        <IconAutoRenew class="w-5 h-5" />
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
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('guerrilla'); domainMenuOpen = false; }}>
        <IconEnvelope class="w-4 h-4 text-orange-500" />
        Guerrilla Mail
      </button>
      <div class="border-t border-base-200 my-1"></div>
      <div class="px-3 py-1.5">
        <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">Burner.kiwi Instances</p>
      </div>
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('burner', 'alphac'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Alphac Mail
      </button>
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('burner', 'raceco'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Raceco Mail
      </button>
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('burner', 'burnerkiwi'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Burner.Kiwi
      </button>
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
        <IconPlus class="w-4 h-4" />
        Add Custom Instance...
      </button>
    </div>
  {/if}
</div>

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
  onOtpOnlyChange={onOtpOnlyChange}
  onSenderDomainChange={onSenderDomainChange}
  onDateFromChange={onDateFromChange}
  onDateToChange={onDateToChange}
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
<div class="px-3 py-2 border-t border-base-200 bg-success/10">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-success">Form Detected:</span>
    <button class="btn btn-xs btn-success text-white" onclick={onAutofillForm}>
      Autofill
    </button>
  </div>
</div>
{/if}

{#if latestOtp !== '------'}
<!-- OTP Container -->
<div class="px-3 py-2 border-t border-base-200 bg-info/10">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-info">Latest OTP:</span>
    <div class="flex items-center gap-2">
      <span class="text-sm font-bold text-info font-mono">{latestOtp}</span>
      <button class="btn btn-ghost btn-xs btn-square" aria-label="Copy OTP" onclick={onCopyOtp}>
        <IconCopy class="w-4 h-4 text-info" />
      </button>
    </div>
  </div>
  {#if otpContext}
    <div class="text-xs text-info/70 mt-1">{otpContext}</div>
  {/if}
</div>
{/if}

<!-- Tag Dialog -->
<TagDialog
  open={tagDialogOpen}
  currentTag={tagTargetAccount?.tag || null}
  existingTags={existingTags}
  onClose={closeTagDialog}
  onSave={saveTag}
/>
