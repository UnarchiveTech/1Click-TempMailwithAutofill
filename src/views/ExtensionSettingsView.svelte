<script lang="ts">
import { browser } from 'wxt/browser';
import IconMail from '@/components/icons/IconMail.svelte';
import IconPlus from '@/components/icons/IconPlus.svelte';
import IconSettings from '@/components/icons/IconSettings.svelte';
import IconSun from '@/components/icons/IconSun.svelte';
import IconUser from '@/components/icons/IconUser.svelte';
import IconX from '@/components/icons/IconX.svelte';
import ConfirmDialog from '@/components/overlays/ConfirmDialog.svelte';
import type { BurnerInstance } from '@/utils/types.js';

let {
  context = 'popup',
  onBack = () => {},
  useCustomPassword = false,
  customPassword = '',
  useCustomName = false,
  customFirstName = '',
  customLastName = '',
  autoCopy = false,
  autoRenew = false,
  selectedProvider = 'burner',
  savingSettings = false,
  loading = false,
  onSaveSettings = () => {},
  onSetUseCustomPassword = undefined,
  onSetCustomPassword = undefined,
  onSetUseCustomName = undefined,
  onSetCustomFirstName = undefined,
  onSetCustomLastName = undefined,
  onSetAutoCopy = undefined,
  onSetAutoRenew = undefined,
  onHardReset = () => {},
  burnerInstances = [],
  selectedBurnerInstance = null,
  onSetBurnerInstance = () => {},
  onExportData = () => {},
  onImportData = () => {},
  onProviderChange = () => {},
  onAddCustomInstance = () => {},
  onLoadBurnerInstances = () => {},
  customColor = '',
  onColorChange = () => {},
  showDeveloperSettings = false,
  enableLogging = false,
  onToggleDeveloperSettings = () => {},
  onToggleEnableLogging = () => {},
}: {
  context?: 'popup' | 'sidepanel' | 'app';
  onBack?: () => void;
  useCustomPassword?: boolean;
  customPassword?: string;
  useCustomName?: boolean;
  customFirstName?: string;
  customLastName?: string;
  autoCopy?: boolean;
  autoRenew?: boolean;
  selectedProvider?: string;
  savingSettings?: boolean;
  loading?: boolean;
  onSaveSettings?: () => void;
  onSetUseCustomPassword?: (value: boolean) => void;
  onSetCustomPassword?: (value: string) => void;
  onSetUseCustomName?: (value: boolean) => void;
  onSetCustomFirstName?: (value: string) => void;
  onSetCustomLastName?: (value: string) => void;
  onSetAutoCopy?: (value: boolean) => void;
  onSetAutoRenew?: (value: boolean) => void;
  onHardReset?: () => void;
  burnerInstances?: BurnerInstance[];
  selectedBurnerInstance?: string | null;
  onSetBurnerInstance?: (instanceId: string) => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onProviderChange?: (provider: string) => void;
  onAddCustomInstance?: (name: string, url: string) => void;
  onLoadBurnerInstances?: () => void;
  customColor?: string;
  onColorChange?: (color: string) => void;
  showDeveloperSettings?: boolean;
  enableLogging?: boolean;
  onToggleDeveloperSettings?: () => void;
  onToggleEnableLogging?: () => void;
} = $props();

let showCustomInstanceForm = $state(false);
let customInstanceName = $state('');
let customInstanceUrl = $state('');
let confirmDialog = $state<{ message: string; onConfirm: () => void } | null>(null);
let confirmDialogRef = $state<HTMLElement | null>(null);

function showConfirmDialog(message: string, onConfirm: () => void) {
  confirmDialog = { message, onConfirm };
  if (confirmDialogRef) {
    confirmDialogRef.focus();
  }
}

function closeConfirmDialog() {
  confirmDialog = null;
}

async function handleProviderChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  const provider = target.value;
  await browser.storage.local.set({ selectedProvider: provider });
  await browser.runtime.sendMessage({ action: 'setProvider', provider });
  onProviderChange(provider);
  if (provider === 'burner') {
    await onLoadBurnerInstances();
  }
}

$effect(() => {
  if (selectedProvider === 'burner') {
    onLoadBurnerInstances();
  }
});

function showAddCustomInstance() {
  showCustomInstanceForm = true;
  customInstanceName = '';
  customInstanceUrl = '';
}

function hideCustomInstanceForm() {
  showCustomInstanceForm = false;
  customInstanceName = '';
  customInstanceUrl = '';
}

function saveCustomInstance() {
  const name = customInstanceName.trim();
  const url = customInstanceUrl.trim();
  if (!name || !url) {
    return;
  }
  onAddCustomInstance(name, url);
  hideCustomInstanceForm();
}
</script>

{#if loading}
  <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
    {#each [1,2,3,4,5] as _}
      <div class="rounded-xl bg-base-100 p-4 space-y-2 animate-pulse">
        <div class="h-3 w-24 bg-base-300 rounded"></div>
        <div class="h-8 w-full bg-base-300 rounded"></div>
      </div>
    {/each}
  </div>
{:else}
<div class="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-20">

  <!-- Page heading -->
  <div class="pt-1">
    <h1 class="text-lg font-bold text-base-content">Preferences</h1>
    <p class="text-xs text-base-content/50 mt-0.5">Configure your extension identity.</p>
  </div>

  <!-- ── Identity ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconUser class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Identity</span>
    </div>

    <!-- Custom Password row -->
    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Custom Password</div>
        <div class="text-xs text-base-content/50">Override system credentials</div>
      </div>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle custom password" checked={useCustomPassword} onchange={(e) => { if (onSetUseCustomPassword) onSetUseCustomPassword((e.target as HTMLInputElement).checked); onSaveSettings(); }} />
    </div>
    {#if useCustomPassword}
      <div class="bg-base-100 rounded-xl px-4 py-3">
        <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Custom Password</div>
        <input type="text" class="w-full bg-transparent text-sm outline-none text-base-content placeholder:text-base-content/30" placeholder="Enter password..." aria-label="Custom password" value={customPassword} oninput={(e) => { if (onSetCustomPassword) onSetCustomPassword((e.target as HTMLInputElement).value); onSaveSettings(); }} />
      </div>
    {/if}

    <!-- Custom Name row -->
    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Custom Name</div>
        <div class="text-xs text-base-content/50">Use for autofill forms</div>
      </div>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle custom name" checked={useCustomName} onchange={(e) => { if (onSetUseCustomName) onSetUseCustomName((e.target as HTMLInputElement).checked); onSaveSettings(); }} />
    </div>
    {#if useCustomName}
      <div class="bg-base-100 rounded-xl px-4 py-3 space-y-3">
        <div>
          <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">First Name</div>
          <input type="text" class="w-full bg-transparent text-sm outline-none text-base-content placeholder:text-base-content/30" placeholder="Alex" aria-label="First name" value={customFirstName} oninput={(e) => { if (onSetCustomFirstName) onSetCustomFirstName((e.target as HTMLInputElement).value); onSaveSettings(); }} />
        </div>
        <div class="border-t border-base-200"></div>
        <div>
          <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Last Name</div>
          <input type="text" class="w-full bg-transparent text-sm outline-none text-base-content placeholder:text-base-content/30" placeholder="Editorial" aria-label="Last name" value={customLastName} oninput={(e) => { if (onSetCustomLastName) onSetCustomLastName((e.target as HTMLInputElement).value); onSaveSettings(); }} />
        </div>
      </div>
    {/if}

    <!-- Auto-Copy row -->
    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Auto-Copy</div>
        <div class="text-xs textbase-content/50">Copy to clipboard after generation</div>
      </div>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle auto-copy" checked={autoCopy} onchange={(e) => { if (onSetAutoCopy) onSetAutoCopy((e.target as HTMLInputElement).checked); onSaveSettings(); }} />
    </div>

    <!-- Auto-Renew row -->
    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Auto-Renew</div>
        <div class="text-xs text-base-content/50">Auto-renew Guerrilla Mail</div>
      </div>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle auto-renew" checked={autoRenew} onchange={(e) => { if (onSetAutoRenew) onSetAutoRenew((e.target as HTMLInputElement).checked); onSaveSettings(); }} />
    </div>
  </section>

  <!-- ── Mail ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconMail class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Mail</span>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3">
      <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Provider</div>
      <select class="w-full bg-transparent text-sm outline-none text-base-content appearance-none cursor-pointer font-medium" aria-label="Select mail provider" value={selectedProvider} onchange={handleProviderChange}>
        <option value="guerrilla">Guerrilla Mail</option>
        <option value="burner">Burner.kiwi Instances</option>
      </select>
    </div>

    {#if selectedProvider === 'burner'}
      <div class="bg-base-100 rounded-xl px-4 py-3">
        <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Instance Selection</div>
        <select class="w-full bg-transparent text-sm outline-none text-base-content appearance-none cursor-pointer font-medium" aria-label="Select burner instance" bind:value={selectedBurnerInstance} onchange={(e) => onSetBurnerInstance((e.target as HTMLSelectElement).value)}>
          <option value="random">Random Instance (Default)</option>
          {#each burnerInstances as instance}
            <option value={instance.id}>{instance.displayName}{instance.isCustom ? ' (Custom)' : ''}</option>
          {/each}
        </select>
      </div>

      {#if !showCustomInstanceForm}
        <button class="w-full rounded-xl border-2 border-dashed border-primary/30 py-2.5 flex items-center justify-center gap-2 text-sm text-primary/70 hover:border-primary/60 hover:text-primary transition-colors" aria-label="Add custom burner instance" onclick={showAddCustomInstance}>
          <IconPlus class="w-4 h-4" />
          Add instance
        </button>
      {:else}
        <div class="bg-base-100 rounded-xl px-4 py-3 space-y-3">
          <div>
            <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Instance Name</div>
            <input type="text" class="w-full bg-transparent text-sm outline-none text-base-content placeholder:text-base-content/30" placeholder="My Instance" aria-label="Custom instance name" bind:value={customInstanceName} />
          </div>
          <div class="border-t border-base-200"></div>
          <div>
            <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">API URL</div>
            <input type="url" class="w-full bg-transparent text-sm outline-none text-base-content placeholder:text-base-content/30" placeholder="https://example.com/api" aria-label="Custom instance URL" bind:value={customInstanceUrl} />
          </div>
          <div class="flex gap-2 pt-1">
            <button class="btn btn-primary btn-sm flex-1 rounded-xl" onclick={saveCustomInstance}>Save</button>
            <button class="btn btn-ghost btn-sm flex-1 rounded-xl" onclick={hideCustomInstanceForm}>Cancel</button>
          </div>
        </div>
      {/if}
    {/if}
  </section>

  <!-- ── Appearance ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconSun class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Appearance</span>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Theme accent</div>
        <div class="text-xs text-base-content/50">Browser color picker</div>
      </div>
      <div class="flex items-center gap-2">
        {#if customColor}
          <button class="btn btn-ghost btn-xs btn-circle" aria-label="Reset color" onclick={() => onColorChange('')}>
            <IconX class="w-3 h-3" />
          </button>
        {/if}
        <label class="cursor-pointer relative">
          <div class="w-8 h-8 rounded-full border-4 border-base-200 shadow-md" style="background:{customColor || 'var(--color-primary)'}"></div>
          <input type="color" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" aria-label="Choose theme color" bind:value={customColor} oninput={(e) => onColorChange((e.target as HTMLInputElement).value)} />
        </label>
      </div>
    </div>
  </section>

  <!-- ── Developer Settings ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconSettings class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Developer Settings</span>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Show Developer Options</div>
        <div class="text-xs text-base-content/50">Enable developer tools</div>
      </div>
      <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle developer settings" bind:checked={showDeveloperSettings} onchange={onToggleDeveloperSettings} />
    </div>

    {#if showDeveloperSettings}
      <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-base-content">Enable Logging</div>
          <div class="text-xs text-base-content/50">Show console logs for debugging</div>
        </div>
        <input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Toggle logging" bind:checked={enableLogging} onchange={onToggleEnableLogging} />
      </div>
    {/if}
  </section>

  <!-- ── Data ── -->
  <div class="flex gap-2">
    <button class="btn btn-outline btn-sm flex-1 rounded-xl" aria-label="Export data" onclick={onExportData}>Export Data</button>
    <button class="btn btn-outline btn-sm flex-1 rounded-xl" aria-label="Import data" onclick={onImportData}>Import Data</button>
  </div>

  <!-- ── Danger Zone ── -->
  <section class="rounded-xl border border-error/30 bg-error/5 px-4 py-4 space-y-2">
    <div class="text-sm font-bold text-error">Danger Zone</div>
    <div class="text-xs text-base-content/50">Irreversibly reset all configuration to factory defaults.</div>
    <button class="w-full btn btn-outline btn-error btn-sm rounded-xl mt-1 font-semibold" aria-label="Perform hard reset" onclick={() => showConfirmDialog('Are you sure you want to perform a hard reset? This action cannot be undone.', onHardReset)}>Hard Reset</button>
  </section>

</div>
{/if}

<ConfirmDialog {confirmDialog} confirmDialogRef={confirmDialogRef} onClose={closeConfirmDialog} />
