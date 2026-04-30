import { logError } from '@/utils/logger.js';

export interface TagSetters {
  onReloadAccounts: () => Promise<void>;
}

export async function updateInboxTag(
  accountId: string,
  tag: string,
  ext: typeof browser,
  setters: TagSetters,
  color?: string
): Promise<void> {
  try {
    await ext.runtime.sendMessage({ type: 'updateInboxTag', inboxId: accountId, tag, color });
    await setters.onReloadAccounts();
  } catch (e) {
    logError('Failed to update tag:', e);
  }
}
