/**
 * Provider instance management
 * Reads instances from JSON config and handles storage operations
 */

import { browser } from 'wxt/browser';
import { DEFAULT_PROVIDER, loadProviderConfig } from '@/services/email-service.js';
import { ProviderInstanceNotFoundError } from '@/utils/errors.js';
import { logError } from '@/utils/logger.js';
import type { ProviderInstance } from '@/utils/types.js';

/**
 * Get instances for a provider from JSON config
 */
export function getProviderInstances(providerId: string): ProviderInstance[] {
  const config = loadProviderConfig(providerId);
  if (!config.multiInstance?.enabled) {
    return [];
  }
  return (
    config.multiInstance.instances?.map((inst) => ({
      ...inst,
      isCustom: false,
    })) || []
  );
}

/**
 * Get all instances for a provider (predefined + custom)
 */
export async function getProviderInstancesWithCustom(
  providerId: string
): Promise<ProviderInstance[]> {
  const predefinedInstances = getProviderInstances(providerId);
  const storageKey = `customInstances_${providerId}` as const;
  // biome-ignore lint/suspicious/noExplicitAny: browser.storage.local.get requires dynamic keys
  const { customInstances = [] } = (await browser.storage.local.get([storageKey as any])) as {
    customInstances?: ProviderInstance[];
  };
  return [...predefinedInstances, ...customInstances];
}

/**
 * Get selected instance for a provider
 */
export async function getSelectedProviderInstance(
  providerId: string
): Promise<ProviderInstance | null> {
  const storageKey = `selectedInstance_${providerId}` as const;
  // biome-ignore lint/suspicious/noExplicitAny: browser.storage.local.get requires dynamic keys
  const { selectedInstance } = (await browser.storage.local.get([storageKey as any])) as {
    selectedInstance?: string;
  };

  const instances = await getProviderInstancesWithCustom(providerId);

  if (!selectedInstance || typeof selectedInstance !== 'string') {
    await browser.storage.local.set({ [storageKey]: 'random' });
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance || null;
  }

  if (selectedInstance === 'random') {
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance || null;
  }

  const selected = instances.find((instance) => instance.id === selectedInstance);
  if (!selected) {
    console.warn(
      `Selected instance ${selectedInstance} not found for provider ${providerId}, falling back to random`
    );
    await browser.storage.local.set({ [storageKey]: 'random' });
    const randomInstance = instances[Math.floor(Math.random() * instances.length)];
    return randomInstance || null;
  }
  return selected;
}

/**
 * Set selected instance for a provider
 */
export async function setProviderInstance(providerId: string, instanceId: string): Promise<void> {
  const instances = await getProviderInstancesWithCustom(providerId);
  const instance = instances.find((i) => i.id === instanceId);
  if (!instance) {
    throw new ProviderInstanceNotFoundError(instanceId);
  }
  const storageKey = `selectedInstance_${providerId}`;
  await browser.storage.local.set({ [storageKey]: instanceId });
}

/**
 * Add custom instance for a provider
 */
export async function addCustomProviderInstance(
  providerId: string,
  instance: Omit<ProviderInstance, 'id' | 'isCustom'>
): Promise<void> {
  const storageKey = `customInstances_${providerId}`;
  // biome-ignore lint/suspicious/noExplicitAny: browser.storage.local.get requires dynamic keys
  const { customInstances = [] } = (await browser.storage.local.get([storageKey as any])) as {
    customInstances?: ProviderInstance[];
  };
  const newInstance: ProviderInstance = {
    ...instance,
    id: `custom_${providerId}_${Date.now()}`,
    isCustom: true,
  };
  customInstances.push(newInstance);
  await browser.storage.local.set({ [storageKey]: customInstances });
}

/**
 * Remove custom instance for a provider
 */
export async function removeCustomProviderInstance(
  providerId: string,
  instanceId: string
): Promise<void> {
  const storageKey = `customInstances_${providerId}`;
  // biome-ignore lint/suspicious/noExplicitAny: browser.storage.local.get requires dynamic keys
  const { customInstances = [] } = (await browser.storage.local.get([storageKey as any])) as {
    customInstances?: ProviderInstance[];
  };
  const filtered = customInstances.filter(
    (instance: ProviderInstance) => instance.id !== instanceId
  );
  await browser.storage.local.set({ [storageKey]: filtered });
}

/**
 * Legacy functions for backward compatibility with existing browser storage.
 * These functions are specific to the 'burner' provider for historical reasons.
 * The storage keys (selectedBurnerInstance, customBurnerInstances) are kept as-is
 * to avoid breaking existing user data. Future versions should migrate to provider-agnostic keys.
 */

/**
 * Get all burner instances (predefined + custom)
 * @deprecated Use getProviderInstancesWithCustom('burner') instead
 */
export async function getBurnerInstances(): Promise<ProviderInstance[]> {
  return getProviderInstancesWithCustom('burner');
}

/**
 * Get selected burner instance
 * @deprecated Use getSelectedProviderInstance('burner') instead
 */
export async function getSelectedBurnerInstance(): Promise<ProviderInstance | null> {
  return getSelectedProviderInstance('burner');
}

/**
 * Set selected burner instance
 * @deprecated Use setProviderInstance('burner', instanceId) instead
 */
export async function setBurnerInstance(instanceId: string): Promise<void> {
  return setProviderInstance('burner', instanceId);
}

/**
 * Add custom burner instance
 * @deprecated Use addCustomProviderInstance('burner', instance) instead
 */
export async function addCustomBurnerInstance(
  instance: Omit<ProviderInstance, 'id' | 'isCustom'>
): Promise<void> {
  return addCustomProviderInstance('burner', instance);
}

/**
 * Remove custom burner instance
 * @deprecated Use removeCustomProviderInstance('burner', instanceId) instead
 */
export async function removeCustomBurnerInstance(instanceId: string): Promise<void> {
  return removeCustomProviderInstance('burner', instanceId);
}

/**
 * Initialize default provider settings
 */
export async function initializeDefaultProvider(): Promise<void> {
  try {
    const { selectedProvider } = (await browser.storage.local.get(['selectedProvider'])) as {
      selectedProvider?: string;
    };
    if (!selectedProvider) {
      await browser.storage.local.set({ selectedProvider: DEFAULT_PROVIDER });
    }
  } catch (error: unknown) {
    logError(
      'Error initializing default provider:',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
