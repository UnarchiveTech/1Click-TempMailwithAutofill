<script lang="ts">
  import FilterList from './FilterList.svelte';
  import { browser } from 'wxt/browser';
  import IconEdit from './icons/IconEdit.svelte';
  import IconEditSquare from './icons/IconEditSquare.svelte';
  import IconRefresh from './icons/IconRefresh.svelte';
  import IconX from './icons/IconX.svelte';
  import IconArchive from './icons/IconArchive.svelte';
  import IconTrash from './icons/IconTrash.svelte';
  import IconChevronDown from './icons/IconChevronDown.svelte';
  import IconPlus from './icons/IconPlus.svelte';
  import IconCopy from './icons/IconCopy.svelte';
  import IconQr from './icons/IconQr.svelte';
  import IconClock from './icons/IconClock.svelte';
  import IconTag from './icons/IconTag.svelte';
  import IconSearch from './icons/IconSearch.svelte';
  import IconEnvelope from './icons/IconEnvelope.svelte';
  import IconFlame from './icons/IconFlame.svelte';
  import IconBell from './icons/IconBell.svelte';
  import IconMail from './icons/IconMail.svelte';

  let {
    selectedEmail = '',
    dropdownOpen = false,
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
    onNavigateToSettings = () => {}
  } = $props<{
    selectedEmail?: string;
    dropdownOpen?: boolean;
    accounts?: any[];
    allAccounts?: any[];
    loading?: boolean;
    searchQuery?: string;
    sortBy?: string;
    otpOnly?: boolean;
    senderDomain?: string;
    dateFrom?: string;
    dateTo?: string;
    notificationsEnabled?: boolean;
    filteredEmails?: any[];
    emails?: any[];
    latestOtp?: string;
    otpContext?: string;
    formDetected?: boolean;
    savedSearchFilters?: any[];
    onSelectAccount?: (address: string) => void;
    onCopyEmail?: () => void;
    onOpenQrDialog?: () => void;
    onCreateInbox?: () => void;
    onAutofillForm?: () => void;
    onRefreshInbox?: () => void;
    onToggleNotifications?: () => void;
    onArchiveAccount?: (account: any) => void;
    onRemoveAccount?: (address: string) => void;
    onReloadAccounts?: () => Promise<void>;
    onEditAccount?: (account: any) => void;
    onExtendAccount?: (account: any) => void;
    onOpenMessageDetail?: (message: any) => void;
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
    onLoadFilter?: (filter: any) => void;
    onDeleteFilter?: (filterId: string) => void;
    onNavigateToSettings?: () => void;
  }>();

  // Context menu state
  let domainMenuOpen = $state(false);
  let domainMenuPosition = $state({ x: 0, y: 0 });
  let dropdownSearch = $state('');
  let collapsedSections = $state({ active: false, archived: false, expired: false });

  // Filter accounts by search (address or tag)
  let filteredAccounts = $derived.by(() => {
    if (!dropdownSearch) return allAccounts;
    const search = dropdownSearch.toLowerCase();
    return allAccounts.filter((a: any) =>
      a.address.toLowerCase().includes(search) ||
      (a.tag && a.tag.toLowerCase().includes(search))
    );
  });

  // Group accounts by status
  let accountsByStatus = $derived.by(() => {
    const active = filteredAccounts.filter((a: any) => a.status === 'active');
    const archived = filteredAccounts.filter((a: any) => a.status === 'archived');
    const expired = filteredAccounts.filter((a: any) => a.status === 'expired');
    return { active, archived, expired };
  });

  // Tag editing state
  let editingTagId = $state<string | null>(null);
  let editingTagValue = $state('');

  // Reactive derived value for current account
  let currentAccount = $derived.by(() => {
    if (!selectedEmail) return null;
    return allAccounts.find((a: any) => a.address === selectedEmail) || null;
  });

  function focusInput(node: HTMLInputElement) {
    node.focus();
  }

  async function updateTag(accountId: string, tag: string) {
    try {
      await browser.runtime.sendMessage({ type: 'updateInboxTag', inboxId: accountId, tag });
      // Reload inboxes to get updated data
      await onReloadAccounts();
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  }

  function startEditingTag(account: any) {
    editingTagId = account.id;
    editingTagValue = account.tag || '';
  }

  function saveTag(account: any) {
    updateTag(account.id, editingTagValue);
    editingTagId = null;
    editingTagValue = '';
  }

  function cancelEditingTag() {
    editingTagId = null;
    editingTagValue = '';
  }
</script>

<!-- Email address hero section -->
<div class="px-4 pt-3 pb-1">
  <p class="text-xs text-base-content/50 mb-0.5">Your Temporary Address</p>
  <!-- Custom dropdown trigger with inline plus button -->
  <div class="relative">
    <div
      class="flex items-center gap-1 cursor-pointer group w-fit max-w-full"
      onclick={() => dropdownOpen = !dropdownOpen}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { dropdownOpen = !dropdownOpen; } }}
      role="button"
      tabindex="0"
      aria-label="Select email address"
    >
      <span class="font-bold text-base text-base-content truncate flex-1 min-w-0">{selectedEmail}</span>
      {#if currentAccount?.provider === 'guerrilla'}
        <button
          class="p-1 hover:bg-base-200 rounded-full shrink-0 text-base-content/50 hover:text-base-content transition-colors"
          onclick={(e) => { e.stopPropagation(); onEditAccount(currentAccount); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onEditAccount(currentAccount); } }}
          aria-label="Edit email address"
        >
          <IconEdit class="w-3.5 h-3.5" />
        </button>
      {/if}
      {#if accounts.length > 1}
        <span class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">+{accounts.length - 1}</span>
      {/if}
      <IconChevronDown class="w-4 h-4 shrink-0 text-base-content/60 group-hover:text-primary transition-colors" />
      <!-- Plus button - always visible -->
      <button
        class="btn btn-xs btn-square rounded-lg bg-primary/10 hover:bg-primary/20 border-0 shrink-0 ml-1"
        aria-label="Generate new address"
        onclick={(e) => {
          e.stopPropagation();
          onCreateInbox();
        }}
        oncontextmenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          domainMenuPosition = { x: e.clientX - 200, y: e.clientY + 10 };
          domainMenuOpen = true;
        }}
      >
        <IconPlus class="w-4 h-4 text-primary" />
      </button>
    </div>

    {#if dropdownOpen}
      <!-- Backdrop to close -->
      <button
        class="fixed inset-0 z-10 cursor-default bg-transparent border-0"
        aria-label="Close dropdown"
        onclick={() => { dropdownOpen = false; dropdownSearch = ''; }}
      ></button>

      <!-- Dropdown panel -->
      <div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
        <!-- Blurred backdrop -->
        <div class="absolute inset-0 bg-base-content/30 backdrop-blur-sm" role="button" tabindex="-1" onclick={() => { dropdownOpen = false; dropdownSearch = ''; }} onkeydown={(e) => { if (e.key === 'Escape') { dropdownOpen = false; dropdownSearch = ''; } }}></div>

        <!-- Close button top-right -->
        <button
          class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center shadow-md transition-colors"
          aria-label="Close dialog"
          onclick={() => { dropdownOpen = false; dropdownSearch = ''; }}
        >
          <IconX class="w-4 h-4 text-base-content/70" />
        </button>

        <!-- Dialog card -->
        <div class="relative z-10 bg-base-100 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 w-80 max-h-[500px]">
          <div class="text-sm font-semibold text-base-content/70 uppercase tracking-wider text-center mb-1">Email Addresses</div>
          
          <!-- Search bar -->
          <div class="relative">
            <input
              type="text"
              placeholder="Search addresses or tags..."
              class="w-full bg-base-200 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-base-content/40"
              bind:value={dropdownSearch}
              aria-label="Search addresses"
            />
            {#if dropdownSearch}
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                aria-label="Clear search"
                onclick={() => dropdownSearch = ''}
              >
                <IconX class="w-4 h-4" />
              </button>
            {/if}
          </div>

          <div class="max-h-80 overflow-y-auto space-y-2">
            <!-- Active section -->
            {#if accountsByStatus.active.length > 0}
              <div>
                <button
                  class="flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => collapsedSections.active = !collapsedSections.active}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {collapsedSections.active ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span class="text-xs font-semibold text-success uppercase tracking-wider">Active</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.active.length}</span>
                </button>
                {#if !collapsedSections.active}
                  <div class="space-y-1 mt-1 pl-5">
                    {#each accountsByStatus.active as account}
                      <div class="flex items-start gap-2 px-3 py-2.5 bg-base-200 rounded-xl group">
                        <!-- Email info -->
                        <button
                          class="flex flex-col flex-1 text-left min-w-0 cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                          aria-label="Select {account.address}"
                          onclick={() => { onSelectAccount(account.address); dropdownOpen = false; }}
                        >
                          <span class="font-semibold text-sm truncate {selectedEmail === account.address ? 'text-primary' : 'text-base-content'}">
                            {account.address}
                          </span>
                          <span class="text-xs {account.autoExtend ? 'text-primary' : 'text-warning'}">
                            {account.expiry}
                          </span>
                        </button>

                        <!-- Action icons -->
                        <div class="flex items-center gap-1 flex-shrink-0 {account.autoExtend ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
                          {#if account.provider === 'guerrilla'}
                            <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Edit address" onclick={() => onEditAccount(account)}>
                              <IconEditSquare class="w-3.5 h-3.5 text-base-content/60" />
                            </button>
                          {/if}
                          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Toggle auto-extend" onclick={() => onExtendAccount(account)}>
                            <IconRefresh class="w-3.5 h-3.5 {account.autoExtend ? 'text-primary' : 'text-base-content/60'}" />
                          </button>
                          {#if account.autoExtend}
                            <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Deactivate address" onclick={() => onRemoveAccount(account.address)}>
                              <IconX class="w-3.5 h-3.5 text-base-content/60" />
                            </button>
                          {/if}
                          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Archive address" onclick={() => onArchiveAccount(account)}>
                            <IconArchive class="w-3.5 h-3.5 text-warning" />
                          </button>
                          {#if account.autoExtend}
                            <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Delete address" onclick={() => onRemoveAccount(account.address)}>
                              <IconTrash class="w-3.5 h-3.5 text-error" />
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Archived section -->
            {#if accountsByStatus.archived.length > 0}
              <div>
                <button
                  class="flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => collapsedSections.archived = !collapsedSections.archived}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {collapsedSections.archived ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-base-content/40"></span>
                  <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Archived</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.archived.length}</span>
                </button>
                {#if !collapsedSections.archived}
                  <div class="space-y-1 mt-1 pl-5">
                    {#each accountsByStatus.archived as account}
                      <div class="flex items-start gap-2 px-3 py-2.5 bg-base-200 rounded-xl group">
                        <!-- Email info -->
                        <button
                          class="flex flex-col flex-1 text-left min-w-0 cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                          aria-label="Select {account.address}"
                          onclick={() => { onSelectAccount(account.address); dropdownOpen = false; }}
                        >
                          <span class="font-semibold text-sm truncate {selectedEmail === account.address ? 'text-primary' : 'text-base-content'}">
                            {account.address}
                          </span>
                          <span class="text-xs text-base-content/50">
                            {account.expiry}
                          </span>
                        </button>

                        <!-- Action icons -->
                        <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Unarchive address" onclick={() => onArchiveAccount(account)}>
                            <IconArchive class="w-3.5 h-3.5 text-success" />
                          </button>
                          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Delete address" onclick={() => onRemoveAccount(account.address)}>
                            <IconTrash class="w-3.5 h-3.5 text-error" />
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Expired section -->
            {#if accountsByStatus.expired.length > 0}
              <div>
                <button
                  class="flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => collapsedSections.expired = !collapsedSections.expired}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {collapsedSections.expired ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                  <span class="text-xs font-semibold text-error uppercase tracking-wider">Expired</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.expired.length}</span>
                </button>
                {#if !collapsedSections.expired}
                  <div class="space-y-1 mt-1 pl-5">
                    {#each accountsByStatus.expired as account}
                      <div class="flex items-start gap-2 px-3 py-2.5 bg-base-200 rounded-xl group">
                        <!-- Email info -->
                        <button
                          class="flex flex-col flex-1 text-left min-w-0 cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                          aria-label="Select {account.address}"
                          onclick={() => { onSelectAccount(account.address); dropdownOpen = false; }}
                        >
                          <span class="font-semibold text-sm truncate {selectedEmail === account.address ? 'text-primary' : 'text-base-content'}">
                            {account.address}
                          </span>
                          <span class="text-xs text-error">
                            {account.expiry}
                          </span>
                        </button>

                        <!-- Action icons -->
                        <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Delete address" onclick={() => onRemoveAccount(account.address)}>
                            <IconTrash class="w-3.5 h-3.5 text-error" />
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          <!-- Archived Mail and Expired Mails buttons -->
          <div class="border-t border-base-200 pt-3 space-y-1.5">
            <button class="btn btn-sm btn-ghost w-full justify-start gap-2 rounded-xl" aria-label="View archived emails" onclick={() => { onOpenArchivedEmails(); dropdownOpen = false; }}>
              <IconArchive class="w-4 h-4 text-base-content/60" />
              Archived Emails
            </button>
            <button class="btn btn-sm btn-ghost w-full justify-start gap-2 rounded-xl" aria-label="View expired emails" onclick={() => { onOpenExpiredEmails(); dropdownOpen = false; }}>
              <IconClock class="w-4 h-4 text-base-content/60" />
              Expired Mails
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Tag and expiry row -->
{#if currentAccount}
    <div class="px-4 pb-2">
      {#if editingTagId === currentAccount.id}
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input input-xs input-bordered flex-1 rounded-lg"
            placeholder="Enter tag..."
            bind:value={editingTagValue}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                saveTag(currentAccount);
              } else if (e.key === 'Escape') {
                cancelEditingTag();
              }
            }}
            use:focusInput
          />
          <button class="btn btn-xs btn-primary rounded-lg" onclick={() => saveTag(currentAccount)}>Save</button>
          <button class="btn btn-xs btn-ghost rounded-lg" onclick={cancelEditingTag}>Cancel</button>
        </div>
      {:else}
        <div class="flex items-center gap-2">
          <!-- Status pill -->
          <div class="flex items-center gap-1.5 rounded-full px-2.5 py-1 {currentAccount.status === 'active' ? 'bg-success/10 border-success/20' : currentAccount.status === 'expired' ? 'bg-error/10 border-error/20' : 'bg-base-200 border-base-300'} border">
            <span class="w-1.5 h-1.5 rounded-full {currentAccount.status === 'active' ? 'bg-success' : currentAccount.status === 'expired' ? 'bg-error' : 'bg-base-content/40'}"></span>
            <span class="text-xs {currentAccount.status === 'active' ? 'text-success' : currentAccount.status === 'expired' ? 'text-error' : 'text-base-content/60'}">{currentAccount.status === 'active' ? 'Active' : currentAccount.status === 'expired' ? 'Expired' : 'Archived'}</span>
          </div>

          <!-- Expiry pill -->
          <div class="flex items-center gap-1.5 rounded-full px-2.5 py-1 {currentAccount.autoExtend ? 'bg-primary/10 border-primary/20' : currentAccount.status === 'expired' ? 'bg-error/10 border-error/20' : 'bg-base-100 border-base-200'} border">
            <IconClock class="w-3 h-3 {currentAccount.autoExtend ? 'text-primary' : currentAccount.status === 'expired' ? 'text-error' : 'text-base-content/50'}" />
            <span class="text-xs {currentAccount.autoExtend ? 'text-primary' : currentAccount.status === 'expired' ? 'text-error' : 'text-base-content/50'}">{currentAccount.expiry}</span>
          </div>

          <!-- Tag pill -->
          <button
            class="flex items-center gap-1.5 cursor-pointer hover:bg-base-200 rounded-full px-2.5 py-1 bg-base-100 border border-base-200 text-left"
            onclick={() => startEditingTag(currentAccount)}
            onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') startEditingTag(currentAccount); }}
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
      {/if}
    </div>
  {/if}

<!-- Action row: Copy Email, QR, New Address, Refresh, Notifications -->
<div class="flex items-center gap-2 px-4 pt-2 pb-2">
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

  <!-- Archive button -->
  {#if currentAccount}
    <button
      class="btn btn-sm btn-square rounded-xl bg-warning/10 hover:bg-warning/20 border-0 tooltip tooltip-bottom text-warning"
      data-tip="Archive"
      aria-label="Archive email"
      onclick={() => onArchiveAccount(currentAccount)}
    >
      <IconArchive class="w-5 h-5" />
    </button>

    <!-- Delete button -->
    <button
      class="btn btn-sm btn-square rounded-xl bg-error/10 hover:bg-error/20 border-0 tooltip tooltip-bottom text-error"
      data-tip="Delete"
      aria-label="Delete email"
      onclick={() => onRemoveAccount(currentAccount.address)}
    >
      <IconTrash class="w-5 h-5" />
    </button>
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
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('alphac'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Alphac Mail
      </button>
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('raceco'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Raceco Mail
      </button>
      <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInbox('burner'); domainMenuOpen = false; }}>
        <IconFlame class="w-4 h-4 text-blue-500" />
        Burner.Kiwi
      </button>
      <div class="border-t border-base-200 my-1"></div>
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
<div class="flex-1 px-3 border-t border-base-200 overflow-y-auto">
  {#if loading}
    <div class="py-2 space-y-2">
      {#each [1, 2, 3] as _}
        <div class="py-2 border-b border-base-200 px-1">
          <div class="flex justify-between mb-1">
            <div class="h-3 w-24 bg-base-200 rounded animate-pulse"></div>
            <div class="h-3 w-12 bg-base-200 rounded animate-pulse"></div>
          </div>
          <div class="h-4 w-3/4 bg-base-200 rounded animate-pulse"></div>
        </div>
      {/each}
    </div>
  {:else if filteredEmails.length === 0}
    <div class="flex flex-col items-center justify-center pt-8 pb-4">
      <IconMail class="w-12 h-12 text-base-content/30 mb-3" />
      <p class="text-sm text-base-content/50 mb-3">No emails found</p>
      {#if searchQuery || otpOnly}
        <button class="btn btn-sm btn-ghost" onclick={onClearFilters}>
          Clear Filters
        </button>
      {:else}
        <button class="btn btn-sm btn-primary" onclick={onRefreshInbox}>
          Refresh Inbox
        </button>
      {/if}
    </div>
  {:else}
    {#each filteredEmails as mail}
      <button class="w-full text-left py-2 border-b border-base-200 hover:bg-base-200 px-1 rounded bg-transparent border-0" onclick={() => onOpenMessageDetail(mail)}>
        <div class="flex justify-between text-xs text-base-content/60">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="font-medium truncate">{mail.from}</span>
            {#if mail.unread}
              <span class="badge badge-xs badge-primary">New</span>
            {/if}
          </div>
          <span>{mail.time}</span>
        </div>
        <div class="text-sm font-semibold mt-0.5 truncate">{mail.subject}</div>
        {#if mail.isOtp}
          <span 
            class="badge badge-xs badge-info mt-1 cursor-pointer hover:badge-info/80" 
            role="button" 
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); }}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); } }}
            aria-label="Copy OTP"
          >
            OTP: {mail.otp}
          </span>
        {/if}
      </button>
    {/each}
  {/if}
</div>

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
