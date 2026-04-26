<script lang="ts">
import IconArchive from '@/components/icons/IconArchive.svelte';
import IconInbox from '@/components/icons/IconInbox.svelte';
import IconSearch from '@/components/icons/IconSearch.svelte';
import IconTrash from '@/components/icons/IconTrash.svelte';
import type { Email } from '@/utils/types.js';

let {
  onBack = () => {},
  archivedSearch = '',
  filteredArchivedEmails = [],
  onSearchChange = () => {},
  onRestore = () => {},
  onDelete = () => {},
  onClearSearch = () => {},
} = $props<{
  onBack?: () => void;
  archivedSearch?: string;
  filteredArchivedEmails?: Email[];
  onSearchChange?: (value: string) => void;
  onRestore?: (email: Email) => void;
  onDelete?: (email: Email) => void;
  onClearSearch?: () => void;
}>();
</script>

<!-- Search -->
<div class="px-4 py-2">
  <label class="input input-bordered input-sm flex items-center gap-2 w-full">
    <IconSearch class="w-4 h-4 text-base-content/40" />
    <input type="text" class="grow text-sm" placeholder="Search archived emails..." bind:value={archivedSearch} oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)} />
  </label>
</div>
<div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
  {#if filteredArchivedEmails.length === 0}
    <div class="flex flex-col items-center justify-center pt-8 pb-4">
      <IconInbox class="w-12 h-12 text-base-content/30 mb-3" />
      <p class="text-sm text-base-content/50 mb-3">No archived emails found</p>
      <button class="btn btn-sm btn-ghost" onclick={onClearSearch}>
        Clear Search
      </button>
    </div>
  {:else}
    {#each filteredArchivedEmails as email}
      <div class="card bg-base-200">
        <div class="card-body p-3">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="font-semibold text-sm">{email.subject}</div>
              <div class="text-xs text-base-content/60 mt-1">
                <div>From: {email.from}</div>
                <div>Date: {email.date}</div>
              </div>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-ghost btn-xs btn-square" aria-label="Restore email" onclick={() => onRestore(email)}>
                <IconArchive class="w-4 h-4 text-success" />
              </button>
              <button class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete email" onclick={() => onDelete(email)}>
                <IconTrash class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
