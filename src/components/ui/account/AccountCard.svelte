<script lang="ts">
import IconArchive from '@/components/icons/IconArchive.svelte';
import IconAutoRenew from '@/components/icons/IconAutoRenew.svelte';
import IconClock from '@/components/icons/IconClock.svelte';
import IconEditSquare from '@/components/icons/IconEditSquare.svelte';
import IconRefresh from '@/components/icons/IconRefresh.svelte';
import IconTrash from '@/components/icons/IconTrash.svelte';
import { canUnarchive } from '@/features/inbox/inbox-management.js';
import type { Account } from '@/utils/types.js';

let {
  account,
  selectedEmail = '',
  isArchived = false,
  onSelectAccount = () => {},
  onExtendAccount = () => {},
  onArchiveAccount = () => {},
  onUnarchiveAccount = () => {},
  onEditAccount = () => {},
  onRemoveAccount = () => {},
  onTagAccount = () => {},
} = $props<{
  account: Account;
  selectedEmail?: string;
  isArchived?: boolean;
  onSelectAccount?: (address: string) => void;
  onExtendAccount?: (account: Account) => void;
  onArchiveAccount?: (account: Account) => void;
  onUnarchiveAccount?: (account: Account) => void;
  onEditAccount?: (account: Account) => void;
  onRemoveAccount?: (address: string) => void;
  onTagAccount?: (account: Account) => void;
}>();

let hoveredAccountId = $state<string | null>(null);
</script>

<div class="px-2 py-1.5 bg-base-200 rounded-xl group/item overflow-hidden" role="listitem">
  <!-- Email address row -->
  <button
    class="flex items-center w-full text-left min-w-0 cursor-pointer bg-transparent border-0 p-0 overflow-hidden mb-1 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
    aria-label={`Select inbox ${account.address}`}
    onclick={() => onSelectAccount(account.address)}
  >
    <span class="font-semibold text-sm truncate {selectedEmail === account.address ? 'text-primary' : 'text-base-content'}">
      {account.address}
    </span>
  </button>

  {#if isArchived}
    <!-- Archived view: simpler actions -->
    <div class={`flex items-center justify-between gap-2 transition-all duration-200 ease-in-out ${hoveredAccountId === account.id ? 'hidden' : ''}`}>
      <span class="text-[10px] px-2 py-0.5 rounded-full bg-base-content/10 text-base-content/50">{account.expiry}</span>
      <div class="flex gap-1 shrink-0" role="toolbar" tabindex="0" onmouseenter={() => hoveredAccountId = account.id} onmouseleave={() => hoveredAccountId = null}>
        {#if canUnarchive(account)}
          <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Unarchive" onclick={(e) => { e.stopPropagation(); onUnarchiveAccount(account); }}>
            <IconArchive class="w-3.5 h-3.5 text-success" />
          </button>
        {/if}
        <button class="btn btn-ghost btn-xs btn-square rounded-lg" aria-label="Delete" onclick={(e) => { e.stopPropagation(); onRemoveAccount(account.address); }}>
          <IconTrash class="w-3.5 h-3.5 text-error" />
        </button>
      </div>
    </div>
    <!-- Expanded archived view -->
    <div class={`grid grid-cols-4 gap-1 pt-1 animate-in fade-in slide-in-from-top-2 duration-300 ${hoveredAccountId === account.id ? '' : 'hidden'}`} onmouseenter={() => hoveredAccountId = account.id} onmouseleave={() => hoveredAccountId = null} role="toolbar" tabindex="0">
      {#if canUnarchive(account)}
        <button
          class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-success/10 transition-all duration-150 group/btn"
          aria-label="Unarchive"
          onclick={(e) => { e.stopPropagation(); onUnarchiveAccount(account); }}
        >
          <IconArchive class="w-4 h-4 text-base-content/50 group-hover/btn:text-success group-hover/btn:scale-110 transition-all duration-150" />
          <span class="text-[10px] text-base-content/50 group-hover/btn:text-success transition-colors duration-150">Unarchive</span>
        </button>
      {:else}
        <div></div>
      {/if}
      <div></div><div></div>
      <button
        class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-error/10 transition-all duration-150 group/btn"
        aria-label="Delete"
        onclick={(e) => { e.stopPropagation(); onRemoveAccount(account.address); }}
      >
        <IconTrash class="w-4 h-4 text-base-content/50 group-hover/btn:text-error group-hover/btn:scale-110 transition-all duration-150" />
        <span class="text-[10px] text-base-content/50 group-hover/btn:text-error transition-colors duration-150">Delete</span>
      </button>
    </div>
  {:else}
    <!-- Active view: pills left, 2x2 grid right -->
    <div class={`flex items-end justify-between gap-2 transition-all duration-200 ease-in-out ${hoveredAccountId === account.id ? 'hidden' : ''}`}>
      <!-- Pills -->
      <div class="flex flex-col gap-1">
        <button
          class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit text-left transition-colors {account.tag ? 'bg-base-content/10 text-base-content/70 hover:bg-base-content/20' : 'bg-base-content/5 text-base-content/40 italic hover:bg-base-content/10'}"
          onclick={(e) => { e.stopPropagation(); onTagAccount(account); }}
          aria-label="{account.tag ? 'Edit tag' : 'Add a tag'}"
        >{account.tag || 'Add a tag'}</button>
        <span class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-base-100 text-base-content/60 w-fit">
          <IconClock class="w-2.5 h-2.5" />
          {account.expiry}
        </span>
      </div>
      <!-- 2x2 icon grid wrapper -->
      <div class="grid grid-cols-2 gap-0 shrink-0" role="toolbar" tabindex="0" onmouseenter={() => hoveredAccountId = account.id} onmouseleave={() => hoveredAccountId = null}>
        <button
          class="btn btn-ghost btn-xs btn-square rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Delete inbox {account.address}"
          onclick={(e) => { e.stopPropagation(); onRemoveAccount(account.address); }}
        >
          <IconTrash class="w-3.5 h-3.5 text-error" />
        </button>
        <button
          class="btn btn-ghost btn-xs btn-square rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Auto-extend inbox {account.address}"
          onclick={(e) => { e.stopPropagation(); onExtendAccount(account); }}
        >
          <IconRefresh class="w-3.5 h-3.5 {account.autoExtend ? 'text-primary' : 'text-base-content/50'}" />
        </button>
        <button
          class="btn btn-ghost btn-xs btn-square rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Archive inbox {account.address}"
          onclick={(e) => { e.stopPropagation(); onArchiveAccount(account); }}
        >
          <IconArchive class="w-3.5 h-3.5 text-warning" />
        </button>
        {#if account.provider === 'guerrilla'}
          <button
            class="btn btn-ghost btn-xs btn-square rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Edit inbox {account.address}"
            onclick={(e) => { e.stopPropagation(); onEditAccount(account); }}
          >
            <IconEditSquare class="w-3.5 h-3.5 text-base-content/50" />
          </button>
        {:else}
          <div></div>
        {/if}
      </div>
    </div>

    <!-- Expanded view: 1x4 labeled row (on hover of icon grid) -->
    <div class={`grid grid-cols-4 gap-0 pt-1 animate-in fade-in slide-in-from-top-2 duration-300 ${hoveredAccountId === account.id ? '' : 'hidden'}`} onmouseenter={() => hoveredAccountId = account.id} onmouseleave={() => hoveredAccountId = null} role="toolbar" tabindex="0">
      <button
        class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-error/10 transition-all duration-150 group/btn focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Delete inbox {account.address}"
        onclick={(e) => { e.stopPropagation(); onRemoveAccount(account.address); }}
      >
        <IconTrash class="w-4 h-4 text-base-content/50 group-hover/btn:text-error group-hover/btn:scale-110 transition-all duration-150" />
        <span class="text-[10px] text-base-content/50 group-hover/btn:text-error transition-colors duration-150">Delete</span>
      </button>
      <button
        class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-primary/10 transition-all duration-150 group/btn focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Auto-extend inbox {account.address}"
        onclick={(e) => { e.stopPropagation(); onExtendAccount(account); }}
      >
        <IconRefresh class="w-4 h-4 {account.autoExtend ? 'text-primary' : 'text-base-content/50'} group-hover/btn:scale-110 transition-transform duration-150" />
        <span class="text-[10px] text-base-content/50 group-hover/btn:text-primary transition-colors duration-150">Extend</span>
      </button>
      <button
        class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-warning/10 transition-all duration-150 group/btn focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Archive inbox {account.address}"
        onclick={(e) => { e.stopPropagation(); onArchiveAccount(account); }}
      >
        <IconArchive class="w-4 h-4 text-base-content/50 group-hover/btn:text-warning group-hover/btn:scale-110 transition-all duration-150" />
        <span class="text-[10px] text-base-content/50 group-hover/btn:text-warning transition-colors duration-150">Archive</span>
      </button>
      {#if account.provider === 'guerrilla'}
        <button
          class="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg hover:bg-base-300 transition-all duration-150 group/btn focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Edit inbox {account.address}"
          onclick={(e) => { e.stopPropagation(); onEditAccount(account); }}
        >
          <IconEditSquare class="w-4 h-4 text-base-content/50 group-hover/btn:text-base-content group-hover/btn:scale-110 transition-all duration-150" />
          <span class="text-[10px] text-base-content/50 group-hover/btn:text-base-content transition-colors duration-150">Edit</span>
        </button>
      {:else}
        <div></div>
      {/if}
    </div>
  {/if}
</div>
