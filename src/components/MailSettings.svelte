<script lang="ts">
  import IconSearch from './icons/IconSearch.svelte';
  import IconArchive from './icons/IconArchive.svelte';
  import IconTrash from './icons/IconTrash.svelte';
  import IconDownload from './icons/IconDownload.svelte';
  import IconEditSquare from './icons/IconEditSquare.svelte';
  import IconRefresh from './icons/IconRefresh.svelte';
  import IconInbox from './icons/IconInbox.svelte';

  let {
    onBack = () => {},
    mgmtTab = 'active',
    mgmtSearch = '',
    selectedAddresses = new Set(),
    mgmtAccounts = [],
    allSelected = false,
    loadingInboxes = false,
    onTabChange = () => {},
    onSearchChange = () => {},
    onToggleSelectAll = () => {},
    onToggleSelect = () => {},
    onArchiveSelected = () => {},
    onDeleteSelected = () => {},
    onExportSelected = () => {},
    onOpenEmailDetail = () => {},
    onArchiveAccount = () => {},
    onExportAccountEmails = () => {},
    onGenerateNewAddress = () => {},
    onEditAccount = () => {},
    onExtendAccount = () => {}
  } = $props<{
    onBack?: () => void;
    mgmtTab?: string;
    mgmtSearch?: string;
    selectedAddresses?: Set<string>;
    mgmtAccounts?: any[];
    allSelected?: boolean;
    loadingInboxes?: boolean;
    onTabChange?: (tab: string) => void;
    onSearchChange?: (value: string) => void;
    onToggleSelectAll?: () => void;
    onToggleSelect?: (id: string) => void;
    onArchiveSelected?: () => void;
    onDeleteSelected?: () => void;
    onExportSelected?: () => void;
    onOpenEmailDetail?: (account: any) => void;
    onArchiveAccount?: (account: any) => void;
    onExportAccountEmails?: (account: any) => void;
    onGenerateNewAddress?: () => void;
    onEditAccount?: (account: any) => void;
    onExtendAccount?: (account: any) => void;
  }>();
</script>


<!-- Tabs -->
<div class="flex gap-1 px-4 pt-3 pb-2">
  {#each ['active', 'expired', 'archived'] as tab}
    <button
      class="btn btn-sm flex-1 capitalize {mgmtTab === tab ? 'btn-primary' : 'btn-ghost text-base-content/60'}"
      onclick={() => onTabChange(tab)}
    >
      {tab}
    </button>
  {/each}
</div>

<!-- Search -->
<div class="px-4 pb-2">
  <label class="input input-bordered input-sm flex items-center gap-2 w-full">
    <IconSearch class="w-4 h-4 text-base-content/40 shrink-0" />
    <input type="text" class="grow text-sm" placeholder="Search emails by address, provider, or status..." bind:value={mgmtSearch} oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)} />
  </label>
</div>

<!-- Select All + bulk actions -->
<div class="flex items-center gap-2 px-4 py-2 border-b border-base-200">
  <label class="flex items-center gap-2 cursor-pointer flex-1">
    <input
      type="checkbox"
      class="checkbox checkbox-sm"
      checked={allSelected}
      onchange={onToggleSelectAll}
    />
    <span class="text-sm font-medium">Select All</span>
    <span class="text-xs text-base-content/50">{selectedAddresses.size} selected</span>
  </label>
  <!-- Bulk: Archive -->
  <button
    class="btn btn-sm btn-square border-0 bg-warning/15 hover:bg-warning/30 disabled:opacity-30"
    aria-label="Archive selected"
    disabled={selectedAddresses.size === 0}
    onclick={onArchiveSelected}
  >
    <IconArchive class="w-4 h-4 text-warning" />
  </button>
  <!-- Bulk: Delete -->
  <button
    class="btn btn-sm btn-square border-0 bg-error/15 hover:bg-error/30 disabled:opacity-30"
    aria-label="Delete selected"
    disabled={selectedAddresses.size === 0}
    onclick={onDeleteSelected}
  >
    <IconTrash class="w-4 h-4 text-error" />
  </button>
  <!-- Bulk: Export/Download -->
  <button
    class="btn btn-sm btn-square border-0 bg-primary/15 hover:bg-primary/30 disabled:opacity-30"
    aria-label="Export selected"
    disabled={selectedAddresses.size === 0}
    onclick={onExportSelected}
  >
    <IconDownload class="w-4 h-4 text-primary" />
  </button>
</div>

<!-- Account cards list -->
<div class="flex-1 overflow-y-auto divide-y divide-base-200">
  {#if loadingInboxes}
    <!-- Skeleton loader -->
    {#each Array(3) as _}
      <div class="flex items-start gap-3 px-4 py-3">
        <div class="skeleton h-5 w-5 shrink-0 rounded"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton h-4 w-3/4"></div>
          <div class="skeleton h-3 w-1/2"></div>
          <div class="skeleton h-3 w-2/3"></div>
        </div>
        <div class="flex gap-1">
          <div class="skeleton h-8 w-8 rounded"></div>
          <div class="skeleton h-8 w-8 rounded"></div>
        </div>
      </div>
    {/each}
  {:else}
    {#each mgmtAccounts as account}
      <div class="flex items-start gap-3 px-4 py-3 hover:bg-base-200/50">
        <!-- Checkbox -->
        <input
          type="checkbox"
          class="checkbox checkbox-sm mt-1 shrink-0"
          checked={selectedAddresses.has(account.id)}
          onchange={() => onToggleSelect(account.id)}
        />
        <!-- Info -->
        <button
          class="flex-1 min-w-0 text-left bg-transparent border-0 p-0"
          onclick={() => onOpenEmailDetail(account)}
        >
          <div class="font-bold text-sm truncate">{account.address}</div>
          <div class="text-xs text-base-content/55 mt-0.5">Created: {account.created}, Last Used: {account.lastUsed}</div>
          <div class="text-xs text-primary mt-0.5">{account.expiry}</div>
          <div class="text-xs text-primary">Received Mails: {account.received}</div>
          <div class="text-xs text-base-content/55">Provider: {account.provider}</div>
        </button>
        <!-- Row actions -->
        <div class="flex items-center gap-1 shrink-0 mt-1">
          {#if account.provider === 'guerrilla'}
            <button
              class="btn btn-sm btn-square border-0 bg-info/15 hover:bg-info/30"
              aria-label="Edit email address"
              onclick={() => onEditAccount(account)}
            >
              <IconEditSquare class="w-4 h-4 text-info" />
            </button>
            <button
              class="btn btn-sm btn-square border-0 bg-success/15 hover:bg-success/30"
              aria-label="Extend email expiry"
              onclick={() => onExtendAccount(account)}
            >
              <IconRefresh class="w-4 h-4 text-success" />
            </button>
          {/if}
          <button
            class="btn btn-sm btn-square border-0 bg-warning/15 hover:bg-warning/30"
            aria-label="Archive {account.address}"
            onclick={() => onArchiveAccount(account)}
          >
            <IconArchive class="w-4 h-4 text-warning" />
          </button>
          <button
            class="btn btn-sm btn-square border-0 bg-primary/15 hover:bg-primary/30"
            aria-label="Export {account.address}"
            onclick={() => onExportAccountEmails(account)}
          >
            <IconDownload class="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>
    {:else}
      <div class="px-4 py-8 text-center">
        <IconInbox class="w-12 h-12 text-base-content/30 mx-auto mb-3" />
        <p class="text-sm text-base-content/50 mb-3">No {mgmtTab} addresses found</p>
        {#if mgmtTab === 'active'}
          <button class="btn btn-sm btn-primary" onclick={onGenerateNewAddress}>
            Generate New Address
          </button>
        {/if}
      </div>
    {/each}
  {/if}
</div>
