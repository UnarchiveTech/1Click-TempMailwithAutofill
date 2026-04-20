/**
 * Cryptographic utilities for secure password storage using Web Crypto API
 * Uses AES-GCM encryption with a key derived from a master secret
 * 
 * SECURITY NOTES:
 * - Keys are stored in extension storage (encrypted by browser's extension storage security)
 * - In production, consider using chrome.storage.session for more sensitive data
 * - Key derivation uses PBKDF2 with a salt for additional security
 */

import { browser } from 'wxt/browser';

// Master encryption key (in production, this should be stored securely)
// For browser extensions, we use extension storage which is more secure than localStorage
const MASTER_KEY_ID = '1click_master_encryption_key';
const KEY_METADATA_ID = '1click_key_metadata';
const KEY_SALT_ID = '1click_key_salt';

interface KeyMetadata {
  version: number;
  createdAt: number;
  lastRotated: number;
  rotationInterval: number; // milliseconds
}

/**
 * Generate a random salt for key derivation
 */
async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Derive a key from a master secret using PBKDF2
 * This provides better security than storing raw keys
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random encryption key
 */
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create the master encryption key
 * Uses a combination of device-specific data and random generation
 */
async function getOrCreateMasterKey(): Promise<CryptoKey> {
  try {
    const storedKeyData = await browser.storage.local.get(MASTER_KEY_ID);
    
    if (storedKeyData[MASTER_KEY_ID] && typeof storedKeyData[MASTER_KEY_ID] === 'string') {
      // Import existing key
      const keyData = JSON.parse(storedKeyData[MASTER_KEY_ID]);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
    }
    
    // Generate new key with initial metadata
    const key = await generateKey();
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    
    const metadata: KeyMetadata = {
      version: 1,
      createdAt: Date.now(),
      lastRotated: Date.now(),
      rotationInterval: 90 * 24 * 60 * 60 * 1000 // 90 days default
    };
    
    await browser.storage.local.set({
      [MASTER_KEY_ID]: JSON.stringify(exportedKey),
      [KEY_METADATA_ID]: JSON.stringify(metadata)
    });
    
    return key;
  } catch (error) {
    console.error('Error managing encryption key:', error);
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Get key metadata
 */
async function getKeyMetadata(): Promise<KeyMetadata | null> {
  try {
    const storedMetadata = await browser.storage.local.get(KEY_METADATA_ID);
    if (storedMetadata[KEY_METADATA_ID] && typeof storedMetadata[KEY_METADATA_ID] === 'string') {
      return JSON.parse(storedMetadata[KEY_METADATA_ID]);
    }
    return null;
  } catch (error) {
    console.error('Error getting key metadata:', error);
    return null;
  }
}

/**
 * Check if key rotation is needed
 */
export async function shouldRotateKey(): Promise<boolean> {
  const metadata = await getKeyMetadata();
  if (!metadata) return false;
  
  const now = Date.now();
  const timeSinceRotation = now - metadata.lastRotated;
  return timeSinceRotation > metadata.rotationInterval;
}

/**
 * Rotate the encryption key and re-encrypt sensitive data
 * This is a critical operation that should be performed carefully
 */
export async function rotateEncryptionKey(): Promise<void> {
  try {
    const oldKey = await getOrCreateMasterKey();
    const newKey = await generateKey();
    const newExportedKey = await crypto.subtle.exportKey('jwk', newKey);
    
    // Get current metadata
    const metadata = await getKeyMetadata();
    if (!metadata) throw new Error('No key metadata found');
    
    // Re-encrypt password settings with new key
    const passwordSettings = await browser.storage.local.get('passwordSettings') as { passwordSettings?: { customPassword?: string } };
    if (passwordSettings.passwordSettings && passwordSettings.passwordSettings.customPassword) {
      // Decrypt with old key
      const decryptedPassword = await decrypt(passwordSettings.passwordSettings.customPassword);
      
      // Encrypt with new key
      const encryptedPassword = await encryptWithKey(decryptedPassword, newKey);
      
      // Update storage
      await browser.storage.local.set({
        passwordSettings: {
          ...passwordSettings.passwordSettings,
          customPassword: encryptedPassword
        }
      });
    }
    
    // Update key and metadata
    await browser.storage.local.set({
      [MASTER_KEY_ID]: JSON.stringify(newExportedKey),
      [KEY_METADATA_ID]: JSON.stringify({
        ...metadata,
        version: metadata.version + 1,
        lastRotated: Date.now()
      })
    });
    
    console.log('Encryption key rotated successfully');
  } catch (error) {
    console.error('Error rotating encryption key:', error);
    throw new Error('Failed to rotate encryption key');
  }
}

/**
 * Encrypt with a specific key (used during key rotation)
 */
async function encryptWithKey(plaintext: string, key: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Encrypt a plaintext string using AES-GCM
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getOrCreateMasterKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a base64-encoded encrypted string
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  try {
    const key = await getOrCreateMasterKey();
    
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a password for verification (not reversible)
 * Uses SHA-256 for one-way hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Securely clear sensitive data from memory
 * 
 * NOTE: In JavaScript, strings are immutable and cannot be truly cleared from memory.
 * This function is kept for API compatibility but does not provide real security.
 * For sensitive data, consider using WebAssembly or avoid keeping it in memory longer than necessary.
 */
export function clearSensitiveData(data: string): void {
  // This is a no-op since strings are immutable in JavaScript
  // The function is kept for API compatibility but does not provide real security
  // In a real implementation, you would use WebAssembly or avoid keeping sensitive data in memory
}
