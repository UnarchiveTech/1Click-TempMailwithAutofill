import type { ProviderConfig, ProviderInstance } from '@/utils/types.js';

export interface PingResult {
  id: string;
  ping: number | 'timeout';
}

const PING_TIMEOUT = 5000; // 5 seconds timeout
const PING_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const pingCache = new Map<string, { result: number | 'timeout'; timestamp: number }>();

/**
 * Ping a URL and return the response time in milliseconds
 */
async function pingUrl(url: string): Promise<number | 'timeout'> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    // Use HEAD request for faster response
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return Math.round(performance.now() - startTime);
  } catch (_error) {
    return 'timeout';
  }
}

/**
 * Get ping result from cache or perform new ping
 */
async function getPing(url: string, id: string): Promise<number | 'timeout'> {
  const cached = pingCache.get(id);
  const now = Date.now();

  // Return cached result if still valid
  if (cached && now - cached.timestamp < PING_CACHE_DURATION) {
    return cached.result;
  }

  // Perform new ping
  const result = await pingUrl(url);
  pingCache.set(id, { result, timestamp: now });

  return result;
}

/**
 * Ping all instances of a provider and return results
 */
export async function pingProviderInstances(
  provider: ProviderConfig,
  instances: ProviderInstance[]
): Promise<Map<string, number | 'timeout'>> {
  const results = new Map<string, number | 'timeout'>();

  // If provider has no instances, ping the provider URL directly
  if (!instances || instances.length === 0) {
    if (provider.apiUrl) {
      const ping = await getPing(provider.apiUrl, provider.type);
      results.set(provider.type, ping);
    }
    return results;
  }

  // Ping each instance (except random)
  for (const instance of instances) {
    if (instance.id === 'random') continue;

    const instanceUrl = instance.apiUrl || provider.apiUrl;
    if (instanceUrl) {
      const ping = await getPing(instanceUrl, instance.id);
      results.set(instance.id, ping);
    }
  }

  return results;
}

/**
 * Get the fastest ping from a map of results
 */
export function getFastestPing(
  results: Map<string, number | 'timeout'>
): number | 'timeout' | null {
  let fastest: number | 'timeout' | null = null;

  for (const ping of results.values()) {
    if (ping === 'timeout') continue;
    if (fastest === null || ping < fastest) {
      fastest = ping;
    }
  }

  return fastest;
}

/**
 * Format ping for display
 */
export function formatPing(ping: number | 'timeout'): string {
  if (ping === 'timeout') return 'timeout';
  return `${ping}ms`;
}

/**
 * Get ping color class based on latency
 */
export function getPingColorClass(ping: number | 'timeout'): string {
  if (ping === 'timeout') return 'text-error';
  if (ping < 100) return 'text-success';
  if (ping < 300) return 'text-warning';
  return 'text-error';
}
