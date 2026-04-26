import { ApiError, ValidationError } from '@/utils/errors.js';
import { logError } from '@/utils/logger.js';
import type { Account, BurnerInstance } from '@/utils/types.js';
import { validateCustomInstanceName, validateCustomInstanceUrl } from '@/utils/validation.js';

export interface SettingsState {
  useCustomPassword: boolean;
  customPassword: string;
  useCustomName: boolean;
  customFirstName: string;
  customLastName: string;
  autoCopy: boolean;
  autoRenew: boolean;
  selectedProvider: string;
  burnerInstances: BurnerInstance[];
  selectedBurnerInstance: string | null;
  customColor: string;
  showDeveloperSettings: boolean;
  enableLogging: boolean;
  savingSettings: boolean;
  settingsLoading: boolean;
}

export interface SettingsSetters {
  setUseCustomPassword: (value: boolean) => void;
  setCustomPassword: (value: string) => void;
  setUseCustomName: (value: boolean) => void;
  setCustomFirstName: (value: string) => void;
  setCustomLastName: (value: string) => void;
  setAutoCopy: (value: boolean) => void;
  setAutoRenew: (value: boolean) => void;
  setSelectedProvider: (value: string) => void;
  setBurnerInstances: (instances: BurnerInstance[]) => void;
  setSelectedBurnerInstance: (instanceId: string | null) => void;
  setCustomColor: (value: string) => void;
  setShowDeveloperSettings: (value: boolean) => void;
  setEnableLogging: (value: boolean) => void;
  setSavingSettings: (value: boolean) => void;
  setSettingsLoading: (value: boolean) => void;
  setShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  loadInboxes: () => Promise<void>;
}

export async function loadSettings(
  ext: typeof browser,
  _state: SettingsState,
  setters: SettingsSetters
) {
  try {
    setters.setSettingsLoading(true);
    const result = (await ext.storage.local.get([
      'passwordSettings',
      'nameSettings',
      'autoCopy',
      'autoRenewGuerrilla',
      'selectedProvider',
      'customColor',
      'developerSettings',
    ])) as {
      passwordSettings?: { useCustom: boolean; customPassword: string };
      nameSettings?: { useCustom: boolean; firstName: string; lastName: string };
      autoCopy?: boolean;
      autoRenewGuerrilla?: boolean;
      selectedProvider?: string;
      customColor?: string;
      developerSettings?: { showDeveloperSettings: boolean; enableLogging: boolean };
    };
    if (result.passwordSettings) {
      setters.setUseCustomPassword(result.passwordSettings.useCustom || false);
      setters.setCustomPassword(result.passwordSettings.customPassword || '');
    }
    if (result.nameSettings) {
      setters.setUseCustomName(result.nameSettings.useCustom || false);
      setters.setCustomFirstName(result.nameSettings.firstName || '');
      setters.setCustomLastName(result.nameSettings.lastName || '');
    }
    if (result.autoCopy !== undefined) setters.setAutoCopy(result.autoCopy);
    if (result.autoRenewGuerrilla !== undefined) setters.setAutoRenew(result.autoRenewGuerrilla);
    if (result.selectedProvider) setters.setSelectedProvider(result.selectedProvider);
    if (result.customColor) setters.setCustomColor(result.customColor);
    if (result.developerSettings) {
      setters.setShowDeveloperSettings(result.developerSettings.showDeveloperSettings || false);
      setters.setEnableLogging(result.developerSettings.enableLogging || false);
    }
  } catch (e: unknown) {
    logError('loadSettings error:', undefined, e instanceof Error ? e : new Error(String(e)));
  } finally {
    setters.setSettingsLoading(false);
  }
}

export async function saveSettings(
  ext: typeof browser,
  state: SettingsState,
  setters: SettingsSetters
) {
  setters.setSavingSettings(true);
  try {
    await ext.storage.local.set({
      passwordSettings: {
        useCustom: state.useCustomPassword,
        customPassword: state.customPassword,
      },
      nameSettings: {
        useCustom: state.useCustomName,
        firstName: state.customFirstName,
        lastName: state.customLastName,
      },
      autoCopy: state.autoCopy,
      autoRenewGuerrilla: state.autoRenew,
      selectedProvider: state.selectedProvider,
      customColor: state.customColor,
      developerSettings: {
        showDeveloperSettings: state.showDeveloperSettings,
        enableLogging: state.enableLogging,
      },
    });
    setters.setShowToast('Settings saved', 'success');
  } catch (e: unknown) {
    logError('saveSettings error:', undefined, e instanceof Error ? e : new Error(String(e)));
    setters.setShowToast('Failed to save settings', 'error');
  } finally {
    setters.setSavingSettings(false);
  }
}

export async function toggleDeveloperSettings(
  ext: typeof browser,
  state: SettingsState,
  setters: SettingsSetters
) {
  const newValue = !state.showDeveloperSettings;
  setters.setShowDeveloperSettings(newValue);
  await ext.storage.local.set({
    developerSettings: { showDeveloperSettings: newValue, enableLogging: state.enableLogging },
  });
}

export async function toggleEnableLogging(
  ext: typeof browser,
  state: SettingsState,
  setters: SettingsSetters
) {
  const newValue = !state.enableLogging;
  setters.setEnableLogging(newValue);
  await ext.storage.local.set({
    developerSettings: {
      showDeveloperSettings: state.showDeveloperSettings,
      enableLogging: newValue,
    },
  });
  setters.setShowToast(`Logging ${newValue ? 'enabled' : 'disabled'}`, 'success');
}

export async function handleProviderChange(
  _ext: typeof browser,
  provider: string,
  setters: SettingsSetters
) {
  setters.setSelectedProvider(provider);
  await setters.loadInboxes();
}

export async function savePasswordSettings(ext: typeof browser, state: SettingsState) {
  await ext.storage.local.set({
    passwordSettings: { useCustom: state.useCustomPassword, customPassword: state.customPassword },
  });
}

export async function saveNameSettings(ext: typeof browser, state: SettingsState) {
  await ext.storage.local.set({
    nameSettings: {
      useCustom: state.useCustomName,
      firstName: state.customFirstName,
      lastName: state.customLastName,
    },
  });
}

export async function saveAutoCopy(ext: typeof browser, value: boolean) {
  await ext.storage.local.set({ autoCopy: value });
}

export async function saveAutoRenew(ext: typeof browser, value: boolean) {
  await ext.storage.local.set({ autoRenewGuerrilla: value });
}

export async function handleColorChange(ext: typeof browser, color: string) {
  await ext.storage.local.set({ customColor: color });
}

export async function changeProvider(
  ext: typeof browser,
  provider: string,
  setters: SettingsSetters
) {
  setters.setSelectedProvider(provider);
  await ext.storage.local.set({ selectedProvider: provider });
  if (provider === 'burner') {
    await loadBurnerInstances(ext, setters);
  }
  await setters.loadInboxes();
  setters.setShowToast(
    `Switched to ${provider === 'guerrilla' ? 'Guerrilla Mail' : 'Burner.kiwi'}`,
    'success'
  );
}

export async function loadBurnerInstances(ext: typeof browser, setters: SettingsSetters) {
  try {
    const response = await ext.runtime.sendMessage({ action: 'getBurnerInstances' });
    if (response?.success) setters.setBurnerInstances(response.instances || []);
    
    // Check the storage directly to see if it's set to 'random'
    const storageResult = await ext.storage.local.get(['selectedBurnerInstance']) as { selectedBurnerInstance?: string };
    
    if (storageResult.selectedBurnerInstance === 'random') {
      // If storage is 'random', keep it as 'random' in the UI
      setters.setSelectedBurnerInstance('random');
    } else if (storageResult.selectedBurnerInstance) {
      // If a specific instance is set in storage, use it in the UI
      setters.setSelectedBurnerInstance(storageResult.selectedBurnerInstance);
    } else if (response?.success && response.instances && response.instances.length > 0) {
      // Set to 'random' by default instead of a specific instance
      setters.setSelectedBurnerInstance('random');
      await ext.runtime.sendMessage({ action: 'setSelectedBurnerInstance', instanceId: 'random' });
    }
  } catch (e: unknown) {
    logError(
      'loadBurnerInstances error:',
      undefined,
      e instanceof Error ? e : new Error(String(e))
    );
  }
}

export async function setBurnerInstance(
  ext: typeof browser,
  instanceId: string,
  setters: SettingsSetters
) {
  if (instanceId === 'random') {
    // Random instance - clear stored selection so it picks randomly each time
    setters.setSelectedBurnerInstance('random');
    await ext.runtime.sendMessage({ action: 'setSelectedBurnerInstance', instanceId: 'random' });
    setters.setShowToast('Random instance mode enabled', 'success');
  } else {
    setters.setSelectedBurnerInstance(instanceId);
    await ext.runtime.sendMessage({ action: 'setSelectedBurnerInstance', instanceId });
    setters.setShowToast('Burner instance updated', 'success');
  }
  await setters.loadInboxes();
}

export async function addCustomInstance(
  ext: typeof browser,
  name: string,
  url: string,
  setters: SettingsSetters
) {
  try {
    validateCustomInstanceName(name);
    validateCustomInstanceUrl(url);
  } catch (e) {
    if (e instanceof ValidationError) {
      setters.setShowToast(e.message, 'error');
      return;
    }
    setters.setShowToast('Validation failed', 'error');
    return;
  }

  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.toLowerCase();

  const blacklistedPatterns = [
    '.tk',
    '.ml',
    '.ga',
    '.cf',
    '.gq',
    '.xyz',
    '.top',
    '.zip',
    '.mov',
    '.exe',
    '.bat',
    '.sh',
  ];
  const isBlacklisted = blacklistedPatterns.some((pattern) => domain.includes(pattern));

  const whitelistedDomains = [
    'burner.kiwi',
    'guerrillamail.com',
    'guerrillamail.de',
    'guerrillamail.net',
    'guerrillamail.org',
    'sharklasers.com',
    'airmail.cc',
    'temp-mail.org',
  ];
  const isWhitelisted = whitelistedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );

  if (isBlacklisted) {
    setters.setShowToast('Domain not allowed', 'error');
    return;
  }

  if (!isWhitelisted) {
    const confirmed = confirm(`Warning: ${domain} is not in the trusted domains list. Add anyway?`);
    if (!confirmed) return;
  }

  const response = await ext.runtime.sendMessage({
    action: 'addCustomBurnerInstance',
    instance: { name: name.toLowerCase().replace(/\s+/g, '-'), displayName: name, apiUrl: url },
  });
  if (response?.success) {
    setters.setShowToast('Custom instance added', 'success');
    await loadBurnerInstances(ext, setters);
  } else setters.setShowToast('Failed to add instance', 'error');
}

export async function hardReset(ext: typeof browser, setters: SettingsSetters) {
  if (
    !confirm(
      '⚠ HARD RESET WARNING\n\nThis will permanently delete ALL extension data. This cannot be undone. Are you sure?'
    )
  )
    return;
  try {
    await ext.storage.local.clear();
    // biome-ignore lint/suspicious/noExplicitAny: Browser storage API
    await (ext.storage.sync as any).clear();
    const response = await ext.runtime.sendMessage({ action: 'hardReset' });
    if (response?.success) {
      setters.setShowToast('Hard reset completed', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else throw new ApiError(response?.error || 'Hard reset failed', { response });
  } catch (_e) {
    setters.setShowToast('Hard reset failed', 'error');
  }
}

export async function exportData(ext: typeof browser) {
  try {
    const result = (await ext.storage.local.get([
      'emailHistory',
      'credentialsHistory',
      'darkMode',
      'inboxes',
      'activeInboxId',
    ])) as {
      emailHistory?: Array<{ email: string; timestamp: number }>;
      credentialsHistory?: Array<{ username: string; password: string; timestamp: number }>;
      darkMode?: string;
      inboxes?: Account[];
      activeInboxId?: string;
    };
    const data = { version: '3.0', exportDate: new Date().toISOString(), data: { ...result } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1click-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (_e) {
    throw new Error('Export failed');
  }
}

export function importData(ext: typeof browser, loadInboxes: () => Promise<void>) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.version || !parsed.data) throw new Error('Invalid format');
      await ext.storage.local.set(parsed.data);
      await loadInboxes();
    } catch (_err) {
      throw new Error('Import failed');
    }
  };
  input.click();
}
