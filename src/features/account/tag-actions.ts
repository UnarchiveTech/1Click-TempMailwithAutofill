import { logDebug, logError } from '@/utils/logger.js';

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
  logDebug(`[tag-actions] updateInboxTag called for: ${accountId}, tag: ${tag}, color: ${color}`);
  try {
    const response = await ext.runtime.sendMessage({
      type: 'updateInboxTag',
      inboxId: accountId,
      tag,
      color,
    });
    logDebug(`[tag-actions] Message response: ${JSON.stringify(response)}`);
    if (response && (response as { success: boolean }).success) {
      logDebug('[tag-actions] Calling onReloadAccounts');
      await setters.onReloadAccounts();
      logDebug('[tag-actions] onReloadAccounts completed');
    }
  } catch (e) {
    logError('Failed to update tag:', undefined, e instanceof Error ? e : new Error(String(e)));
  }
}
