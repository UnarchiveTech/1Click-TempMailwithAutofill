import type { Browser } from 'wxt/browser';
import { logError } from '@/utils/logger.js';

export interface SavedLogin {
  id: string;
  website: string;
  email: string;
  username: string;
  password: string;
  timestamp: number;
}

export interface LoginState {
  savedLogins: SavedLogin[];
}

export interface LoginSetters {
  setSavedLogins: (logins: SavedLogin[]) => void;
}

export async function loadLoginInfo(ext: Browser, setters: LoginSetters) {
  try {
    const result = (await ext.storage.local.get(['loginInfo'])) as {
      loginInfo?: Record<string, Array<{ username: string; password: string; timestamp: number }>>;
    };
    const loginInfo = result.loginInfo || {};
    const savedLogins = Object.entries(loginInfo).flatMap(
      ([domain, entries]: [
        string,
        Array<{ username: string; password: string; timestamp: number }>,
      ]) =>
        entries.map((entry, i) => ({
          id: `${domain}-${i}`,
          website: domain,
          email: entry.username,
          ...entry,
        }))
    );
    setters.setSavedLogins(savedLogins);
  } catch (e: unknown) {
    logError('loadLoginInfo error:', undefined, e instanceof Error ? e : new Error(String(e)));
  }
}
