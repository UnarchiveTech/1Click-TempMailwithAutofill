/**
 * Provider configuration validation utilities
 */

import type { ProviderConfig } from '../services/email-service.js';

/**
 * Validate a provider configuration against the JSON schema
 * @throws Error if validation fails
 */
export function validateProviderConfig(config: unknown): asserts config is ProviderConfig {
  // Basic structural validation
  if (typeof config !== 'object' || config === null) {
    throw new Error('Provider config must be an object');
  }

  const cfg = config as Record<string, unknown>;

  // Required fields
  const requiredFields = ['id', 'name', 'apiUrl', 'auth', 'operations', 'expiry'];
  for (const field of requiredFields) {
    if (!(field in cfg)) {
      throw new Error(`Provider config missing required field: ${field}`);
    }
  }

  // Validate auth
  if (typeof cfg.auth !== 'object' || cfg.auth === null) {
    throw new Error('Provider config auth must be an object');
  }
  const auth = cfg.auth as Record<string, unknown>;
  if (!auth.type || !['query_parameter', 'header'].includes(auth.type as string)) {
    throw new Error('Provider config auth.type must be "query_parameter" or "header"');
  }
  if (auth.type === 'query_parameter') {
    if (!auth.paramName || typeof auth.paramName !== 'string') {
      throw new Error(
        'Provider config auth.paramName is required for query_parameter auth and must be a string'
      );
    }
  } else if (auth.type === 'header') {
    if (!auth.headerName || typeof auth.headerName !== 'string') {
      throw new Error(
        'Provider config auth.headerName is required for header auth and must be a string'
      );
    }
  }

  // Validate operations
  if (typeof cfg.operations !== 'object' || cfg.operations === null) {
    throw new Error('Provider config operations must be an object');
  }

  // Validate expiry
  if (typeof cfg.expiry !== 'object' || cfg.expiry === null) {
    throw new Error('Provider config expiry must be an object');
  }
  const expiry = cfg.expiry as Record<string, unknown>;
  if (typeof expiry.duration !== 'number' || expiry.duration <= 0) {
    throw new Error('Provider config expiry.duration must be a positive number');
  }
  if (typeof expiry.renewable !== 'boolean') {
    throw new Error('Provider config expiry.renewable must be a boolean');
  }
}

/**
 * Validate all provider configurations
 * @throws Error if any validation fails
 */
export function validateAllProviderConfigs(
  configs: unknown[]
): asserts configs is ProviderConfig[] {
  if (!Array.isArray(configs)) {
    throw new Error('Provider configs must be an array');
  }

  if (configs.length === 0) {
    throw new Error('Provider configs array cannot be empty');
  }

  // Check for duplicate IDs
  const ids = new Set<string>();
  for (const config of configs) {
    validateProviderConfig(config);
    const id = (config as ProviderConfig).id;
    if (ids.has(id)) {
      throw new Error(`Duplicate provider ID detected: ${id}`);
    }
    ids.add(id);
  }
}
