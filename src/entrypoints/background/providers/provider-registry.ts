/**
 * Provider configuration and Burner.kiwi instance management
 */

import { browser } from 'wxt/browser';
import { ProviderInstanceNotFoundError } from '@/utils/errors.js';
import { logError } from '@/utils/logger.js';
import type { BurnerInstance, MailProvider, ProviderConfig } from '@/utils/types.js';

export const PREDEFINED_BURNER_INSTANCES: BurnerInstance[] = [
  {
    id: 'alphac',
    name: 'alphac',
    displayName: 'Alphac Mail',
    apiUrl: 'https://alphac.qzz.io/api/v2',
  },
  {
    id: 'raceco',
    name: 'raceco',
    displayName: 'Raceco Mail',
    apiUrl: 'https://raceco.dpdns.org/api/v2',
  },
  {
    id: 'burnerkiwi',
    name: 'burner.kiwi',
    displayName: 'Burner.Kiwi',
    apiUrl: 'https://burner.kiwi/api/v2',
  },
];

export const PROVIDERS: Record<MailProvider, ProviderConfig> = {
  guerrilla: {
    name: 'guerrilla',
    displayName: 'Guerrilla Mail',
    apiUrl: 'https://api.guerrillamail.com/ajax.php',
    type: 'guerrilla',
  },
  burner: {
    name: 'burner',
    displayName: 'Burner.kiwi',
    apiUrl: '', // Will be set based on selected instance
    type: 'burner',
  },
};

export async function getBurnerInstances(): Promise<BurnerInstance[]> {
  const { customBurnerInstances = [] } = (await browser.storage.local.get([
    'customBurnerInstances',
  ])) as { customBurnerInstances?: BurnerInstance[] };
  return [...PREDEFINED_BURNER_INSTANCES, ...customBurnerInstances];
}

export async function getSelectedBurnerInstance(): Promise<BurnerInstance | null> {
  const { selectedBurnerInstance } = (await browser.storage.local.get([
    'selectedBurnerInstance',
  ])) as { selectedBurnerInstance?: string };
  
  const instances = await getBurnerInstances();
  
  if (!selectedBurnerInstance || typeof selectedBurnerInstance !== 'string') {
    // Set default to 'random' instead of a specific instance
    await browser.storage.local.set({ selectedBurnerInstance: 'random' });
    // Return a random instance when random mode is selected
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance;
  }

  // If random is selected, return a random instance
  if (selectedBurnerInstance === 'random') {
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance;
  }

  // Return the specific selected instance
  const selected = instances.find((instance) => instance.id === selectedBurnerInstance);
  if (!selected) {
    // If the selected instance doesn't exist (e.g., deleted custom instance), fall back to random
    console.warn(`Selected instance ${selectedBurnerInstance} not found, falling back to random`);
    await browser.storage.local.set({ selectedBurnerInstance: 'random' });
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance;
  }
  return selected;
}

export async function setBurnerInstance(instanceId: string): Promise<void> {
  const instances = await getBurnerInstances();
  const instance = instances.find((i) => i.id === instanceId);
  if (!instance) {
    throw new ProviderInstanceNotFoundError(instanceId);
  }
  await browser.storage.local.set({ selectedBurnerInstance: instanceId });
}

export async function addCustomBurnerInstance(
  instance: Omit<BurnerInstance, 'id' | 'isCustom'>
): Promise<void> {
  const { customBurnerInstances = [] } = (await browser.storage.local.get([
    'customBurnerInstances',
  ])) as { customBurnerInstances?: BurnerInstance[] };
  const newInstance: BurnerInstance = {
    ...instance,
    id: `custom_${Date.now()}`,
    isCustom: true,
  };
  customBurnerInstances.push(newInstance);
  await browser.storage.local.set({ customBurnerInstances });
}

export async function removeCustomBurnerInstance(instanceId: string): Promise<void> {
  const { customBurnerInstances = [] } = (await browser.storage.local.get([
    'customBurnerInstances',
  ])) as { customBurnerInstances?: BurnerInstance[] };
  const filtered = customBurnerInstances.filter(
    (instance: BurnerInstance) => instance.id !== instanceId
  );
  await browser.storage.local.set({ customBurnerInstances: filtered });
}

export async function initializeDefaultProvider(): Promise<void> {
  try {
    const { selectedProvider } = (await browser.storage.local.get(['selectedProvider'])) as {
      selectedProvider?: string;
    };
    if (!selectedProvider) {
      await browser.storage.local.set({ selectedProvider: 'burner' });
    }

    const { selectedBurnerInstance } = (await browser.storage.local.get([
      'selectedBurnerInstance',
    ])) as { selectedBurnerInstance?: string };
    // Only set default to 'random' if not already set (don't override user selection)
    if (!selectedBurnerInstance) {
      await browser.storage.local.set({
        selectedBurnerInstance: 'random',
      });
    }
  } catch (error: unknown) {
    logError(
      'Error initializing default provider:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
