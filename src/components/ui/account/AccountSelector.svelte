<script lang="ts">
import { browser } from 'wxt/browser';
import IconChevronDown from '@/components/icons/IconChevronDown.svelte';
import IconEdit from '@/components/icons/IconEdit.svelte';
import IconEnvelope from '@/components/icons/IconEnvelope.svelte';
import IconFlame from '@/components/icons/IconFlame.svelte';
import IconPlus from '@/components/icons/IconPlus.svelte';
import IconX from '@/components/icons/IconX.svelte';
import TagDialog from '@/components/overlays/TagDialog.svelte';
import { updateInboxTag } from '@/features/account/tag-actions.js';
import {
  DEFAULT_PROVIDER,
  loadAllProviderConfigs,
  loadProviderConfig,
} from '@/services/email-service.js';
import { getSelectedProviderInstance } from '@/utils/instance-manager.js';
import type { Account } from '@/utils/types.js';
import AccountCard from './AccountCard.svelte';

let {
  selectedEmail = '',
  accounts = [],
  allAccounts = [],
  onSelectAccount = () => {},
  onEditAccount = () => {},
  onCreateInbox = () => {},
  onNavigateToManage = () => {},
  onReloadAccounts = async () => {},
  onNavigateToSettings = () => {},
  onCreateInboxWithProvider = () => {},
  onToggleAutoExtend = () => {},
  onArchiveAccount = () => {},
  onUnarchiveAccount = () => {},
  onRemoveAccount = () => {},
}: {
  selectedEmail?: string;
  accounts?: Account[];
  allAccounts?: Account[];
  onSelectAccount?: (email: string) => void;
  onEditAccount?: (account: Account) => void;
  onCreateInbox?: (provider?: string, instanceId?: string) => void;
  onNavigateToManage?: () => void;
  onReloadAccounts?: () => Promise<void>;
  onNavigateToSettings?: () => void;
  onCreateInboxWithProvider?: (provider: string, instanceId?: string) => void;
  onToggleAutoExtend?: (account: Account) => void;
  onArchiveAccount?: (account: Account) => void;
  onUnarchiveAccount?: (account: Account) => void;
  onRemoveAccount?: (address: string) => void;
} = $props();

// Dropdown state
let dropdownOpen = $state(false);
let dropdownSearch = $state('');
let openSection = $state<'active' | 'archived' | 'expired' | null>('active');

// Domain menu state (for provider selection)
let domainMenuOpen = $state(false);
let domainMenuPosition = $state({ x: 0, y: 0 });

// Tag editing state
let tagDialogOpen = $state(false);
let tagTargetAccount = $state<Account | null>(null);

// Load providers dynamically
let allProviders = $derived.by(() => {
  try {
    return Object.values(loadAllProviderConfigs());
  } catch {
    return [];
  }
});

function toggleSection(section: 'active' | 'archived' | 'expired') {
  openSection = openSection === section ? null : section;
}

// Filter accounts by search (address or tag)
let filteredAccounts = $derived.by(() => {
  if (!dropdownSearch) return allAccounts;
  const search = dropdownSearch.toLowerCase();
  return allAccounts.filter(
    (a: Account) =>
      a.address.toLowerCase().includes(search) || a.tag?.toLowerCase().includes(search)
  );
});

// Group accounts by status
let accountsByStatus = $derived.by(() => {
  const active = filteredAccounts.filter((a: Account) => a.status === 'active');
  const archived = filteredAccounts.filter((a: Account) => a.status === 'archived');
  const expired = filteredAccounts.filter((a: Account) => a.status === 'expired');
  return { active, archived, expired };
});

// Reactive derived value for current account
let currentAccount = $derived.by(() => {
  if (!selectedEmail) return null;
  return allAccounts.find((a: Account) => a.address === selectedEmail) || null;
});

// Accounts of same status as current account for prev/next navigation
let currentStatusAccounts = $derived.by(() => {
  if (!selectedEmail) return [];
  const current = allAccounts.find((a: Account) => a.address === selectedEmail);
  if (!current) return [];
  return allAccounts.filter((a: Account) => a.status === current.status);
});

let currentIndexInStatus = $derived.by(() => {
  if (!selectedEmail) return -1;
  return currentStatusAccounts.findIndex((a: Account) => a.address === selectedEmail);
});

function goToPrev() {
  if (currentIndexInStatus > 0) {
    onSelectAccount(currentStatusAccounts[currentIndexInStatus - 1].address);
  }
}

function goToNext() {
  if (currentIndexInStatus < currentStatusAccounts.length - 1) {
    onSelectAccount(currentStatusAccounts[currentIndexInStatus + 1].address);
  }
}

async function updateTag(accountId: string, tag: string, color?: string) {
  await updateInboxTag(accountId, tag, browser, { onReloadAccounts }, color);
}

function openTagDialog() {
  if (!currentAccount) return;
  tagTargetAccount = currentAccount;
  tagDialogOpen = true;
}

function openTagDialogForAccount(account: Account) {
  tagTargetAccount = account;
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
</script>

<div class="px-1">
  <!-- Custom dropdown trigger -->
  <div class="relative mt-1 flex items-center gap-2">
    <!-- Floating status label above border -->
    {#if currentAccount}
      <div class="absolute left-3" style="top: -10px; z-index: 10;">
        <span
          class="px-1.5 text-[11px] font-semibold leading-none {currentAccount?.status === 'active' ? 'text-success' : currentAccount?.status === 'expired' ? 'text-error' : 'text-base-content/50'} {currentAccount?.autoExtend ? 'bg-primary/10' : currentAccount?.status === 'expired' ? 'bg-error/10' : 'bg-base-100'}"
        >{currentAccount.status === 'active' ? 'Active' : currentAccount.status === 'expired' ? 'Expired' : 'Archived'}</span>
      </div>
    {/if}
    <div
      class="flex items-center gap-0 px-1.5 py-2 rounded-xl border {currentAccount?.status === 'active' ? 'border-base-content/30' : currentAccount?.status === 'expired' ? 'border-error/30' : 'border-base-300'} {currentAccount?.autoExtend ? 'bg-primary/10' : currentAccount?.status === 'expired' ? 'bg-error/10' : 'bg-base-100'} flex-1 min-w-0 overflow-hidden"
    >
      <!-- Prev button -->
      <button
        class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-primary hover:text-primary/80 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        onclick={(e) => { e.stopPropagation(); goToPrev(); }}
        disabled={currentIndexInStatus <= 0}
        aria-label="Previous address"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>

      <!-- Email text - clickable to open dropdown -->
      <button
        class="font-medium text-sm text-base-content truncate flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
        onclick={() => dropdownOpen = !dropdownOpen}
        aria-label="Select email address"
        title={selectedEmail}
      >
        <span class="tooltip tooltip-bottom" data-tip={selectedEmail}>{selectedEmail}</span>
      </button>

      <!-- Edit button (Guerrilla Mail only) -->
      {#if currentAccount?.provider === 'guerrilla'}
        <button
          class="p-1 hover:bg-base-200 rounded-full shrink-0 text-base-content/40 hover:text-base-content transition-colors"
          onclick={(e) => { e.stopPropagation(); onEditAccount(currentAccount); }}
          aria-label="Edit email address"
        >
          <IconEdit class="w-3.5 h-3.5" />
        </button>
      {/if}

      <!-- +N badge -->
      {#if accounts.length > 1}
        <span class="text-xs font-semibold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full shrink-0">+{accounts.length - 1}</span>
      {/if}

      <!-- Next button -->
      <button
        class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-primary hover:text-primary/80 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        onclick={(e) => { e.stopPropagation(); goToNext(); }}
        disabled={currentIndexInStatus >= currentStatusAccounts.length - 1}
        aria-label="Next address"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Separator -->
      <span class="w-px h-4 bg-base-content/20 shrink-0"></span>

      <!-- Dropdown chevron -->
      <button
        class="shrink-0 p-0.5 text-primary hover:text-primary/80 transition-colors"
        onclick={() => dropdownOpen = !dropdownOpen}
        aria-label="Open account list"
      >
        <IconChevronDown class="w-4 h-4" />
      </button>
    </div>
    <!-- Plus button - outside pill -->
    <button
      class="btn btn-xs btn-square rounded-lg bg-primary hover:bg-primary/90 border-0 shrink-0"
      aria-label="Generate new address"
      onclick={async () => {
        const provider = currentAccount?.provider || DEFAULT_PROVIDER;
        const selectedInstance = await getSelectedProviderInstance(provider);
        if (selectedInstance?.id && selectedInstance.id !== 'random') {
          onCreateInbox(provider, selectedInstance.id);
        } else {
          onCreateInbox();
        }
      }}
      oncontextmenu={(e) => {
        e.preventDefault();
        domainMenuPosition = { x: e.clientX - 200, y: e.clientY + 10 };
        domainMenuOpen = true;
      }}
    >
      <IconPlus class="w-4 h-4 text-primary-content" />
    </button>

    <!-- Domain context menu -->
    {#if domainMenuOpen}
      <button class="fixed inset-0 z-40 bg-transparent cursor-default" aria-label="Close menu" onclick={() => domainMenuOpen = false}></button>
      <div 
        class="fixed z-50 bg-base-100 rounded-xl shadow-2xl border border-base-300 py-2 w-56 max-h-96 overflow-y-auto"
        style="left: {domainMenuPosition.x}px; top: {domainMenuPosition.y}px;"
      >
        {#each allProviders as provider}
          <div class="px-3 py-1.5">
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">{provider.displayName}</p>
          </div>
          <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2" onclick={() => { onCreateInboxWithProvider(provider.id); domainMenuOpen = false; }}>
            {#if (provider as any).ui?.icon === 'envelope'}
              <IconEnvelope class="w-4 h-4 {(provider as any).ui?.color || 'text-primary'}" />
            {:else if (provider as any).ui?.icon === 'flame'}
              <IconFlame class="w-4 h-4 {(provider as any).ui?.color || 'text-primary'}" />
            {/if}
            {provider.displayName}
          </button>
          {#if provider.multiInstance?.enabled && provider.multiInstance.instances}
            {#each provider.multiInstance.instances as instance}
              <button class="w-full px-4 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2 pl-8" onclick={() => { onCreateInboxWithProvider(provider.id, instance.id); domainMenuOpen = false; }}>
                {#if (provider as any).ui?.icon === 'flame'}
                  <IconFlame class="w-4 h-4 {(provider as any).ui?.color || 'text-primary'}" />
                {/if}
                {instance.displayName || instance.name}
              </button>
            {/each}
          {/if}
          {#if provider !== allProviders[allProviders.length - 1]}
            <div class="border-t border-base-200 my-1"></div>
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
          <IconPlus class="w-4 h-4" />
          Add Custom Instance...
        </button>
      </div>
    {/if}

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
        <div class="relative z-10 bg-base-100 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-80 h-[500px]">
          <!-- Search bar -->
          <div class="relative">
            <input
              type="text"
              placeholder="Search addresses or tags..."
              class="w-full bg-base-200 rounded-xl px-3 py-1.5 text-sm outline-none placeholder:text-base-content/40"
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

          <!-- Generate New Mail Address button -->
          <button
            class="w-full px-3 py-2 text-left hover:bg-primary hover:text-primary-content text-sm flex items-center gap-2 text-base-content/60 rounded-lg transition-colors"
            onclick={async () => {
              dropdownOpen = false;
              const provider = currentAccount?.provider || DEFAULT_PROVIDER;
              const selectedInstance = await getSelectedProviderInstance(provider);
              if (selectedInstance?.id && selectedInstance.id !== 'random') {
                onCreateInbox(provider, selectedInstance.id);
              } else {
                onCreateInbox();
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Generate New Mail Address
          </button>

          <div class="space-y-1 flex-1">
            <!-- Active section -->
            {#if true}
              <div>
                <button
                  class="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => toggleSection('active')}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {openSection !== 'active' ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span class="text-xs font-semibold text-success uppercase tracking-wider">Active</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.active.length}</span>
                </button>
                {#if openSection === 'active'}
                  <div class="space-y-1 mt-1 max-h-67 overflow-y-auto">
                    {#each accountsByStatus.active as account}
                      <AccountCard
                        {account}
                        {selectedEmail}
                        onSelectAccount={(address) => { onSelectAccount(address); dropdownOpen = false; }}
                        onToggleAutoExtend={onToggleAutoExtend}
                        onArchiveAccount={onArchiveAccount}
                        onUnarchiveAccount={onUnarchiveAccount}
                        onEditAccount={onEditAccount}
                        onRemoveAccount={onRemoveAccount}
                        onTagAccount={openTagDialogForAccount}
                      />
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Archived section -->
            {#if true}
              <div>
                <button
                  class="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => toggleSection('archived')}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {openSection !== 'archived' ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-base-content/40"></span>
                  <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Archived</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.archived.length}</span>
                </button>
                {#if openSection === 'archived'}
                  <div class="space-y-1 mt-1 max-h-67 overflow-y-auto">
                    {#each accountsByStatus.archived as account}
                      <AccountCard
                        {account}
                        {selectedEmail}
                        isArchived={true}
                        onSelectAccount={(address) => { onSelectAccount(address); dropdownOpen = false; }}
                        onArchiveAccount={onArchiveAccount}
                        onUnarchiveAccount={onUnarchiveAccount}
                        onRemoveAccount={onRemoveAccount}
                      />
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Expired section -->
            {#if true}
              <div>
                <button
                  class="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-base-200 rounded-lg transition-colors"
                  onclick={() => toggleSection('expired')}
                >
                  <IconChevronDown class="w-3 h-3 transition-transform {openSection !== 'expired' ? '-rotate-90' : ''}" />
                  <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                  <span class="text-xs font-semibold text-error uppercase tracking-wider">Expired</span>
                  <span class="text-xs text-base-content/40 ml-auto">{accountsByStatus.expired.length}</span>
                </button>
                {#if openSection === 'expired'}
                  <div class="space-y-1 mt-1 max-h-67 overflow-y-auto">
                    {#each accountsByStatus.expired as account}
                      <AccountCard
                        {account}
                        {selectedEmail}
                        onSelectAccount={(address) => { onSelectAccount(address); dropdownOpen = false; }}
                        onRemoveAccount={onRemoveAccount}
                      />
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          <button
            class="w-full px-3 py-2 text-left hover:bg-base-200 text-sm flex items-center gap-2 text-base-content/60 hover:text-base-content rounded-lg transition-colors"
            onclick={() => { dropdownOpen = false; onNavigateToManage(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 9.18a23.848 23.848 0 00-8.835 2.535M10.34 6.66a23.847 23.847 0 00-8.835-2.535" />
            </svg>
            Manage All Addresses
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Tag Dialog -->
{#if tagDialogOpen && tagTargetAccount}
  <TagDialog
    open={tagDialogOpen}
    currentTag={tagTargetAccount.tag || ''}
    currentTagColor={tagTargetAccount.tagColor || null}
    onClose={closeTagDialog}
    onSave={saveTag}
    existingTags={Array.from(
      new Set(
        allAccounts.map((a: Account) => a.tag).filter((tag: string | undefined): tag is string => !!tag)
      )
    )}
    tagColors={Object.fromEntries(
      allAccounts
        .filter((a: Account) => a.tag && a.tagColor)
        .map((a: Account) => [a.tag!, a.tagColor!])
    )}
  />
{/if}
