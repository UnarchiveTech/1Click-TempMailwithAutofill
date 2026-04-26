/**
 * Runtime message handler — routes incoming messages to the appropriate module functions
 */

import { browser } from 'wxt/browser';
import { logError, logInfo } from '@/utils/logger.js';
import type { Account } from '@/utils/types.js';
import { handleUpdateSessionCredentials } from '../credentials/session-credentials.js';
import { getAnalytics } from '../inbox/analytics.js';
import { archiveInboxEmails, getArchivedEmails } from '../inbox/email-storage.js';
import {
  checkNewEmails,
  createInbox,
  deleteInbox,
  setupInboxExpiryCheck,
  setupPeriodicEmailCheck,
} from '../inbox/inbox-manager.js';
import { autoRenewGuerrillaInbox, guerrillaApiCall } from '../providers/guerrilla-api.js';
import {
  addCustomBurnerInstance,
  getBurnerInstances,
  getSelectedBurnerInstance,
  initializeDefaultProvider,
  removeCustomBurnerInstance,
} from '../providers/provider-registry.js';

export function registerMessageHandler(): void {
  browser.runtime.onMessage.addListener(
    // biome-ignore lint/suspicious/noExplicitAny: Chrome runtime message types
    (message: any, sender: any, sendResponse: (response: any) => void) => {
      logInfo('Received message:', { message });

      if (message.type === 'createInbox') {
        (async () => {
          try {
            const { selectedProvider = 'burner' } = (await browser.storage.local.get([
              'selectedProvider',
            ])) as { selectedProvider?: string };
            let provider = message.provider || selectedProvider;
            let instanceId = message.instanceId;

            // Handle burner instance IDs (alphac, raceco, burnerkiwi)
            // Don't change global settings, just pass as instanceId for this specific inbox creation
            const burnerInstanceIds = ['alphac', 'raceco', 'burnerkiwi'];
            if (burnerInstanceIds.includes(provider)) {
              instanceId = provider;
              provider = 'burner';
            }

            const inbox = await createInbox(provider, instanceId, message.user);
            sendResponse({ success: true, inbox });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'checkEmails') {
        (async () => {
          try {
            const messages = await checkNewEmails(message.inboxId, message.filters);
            sendResponse({ success: true, messages });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'deleteInbox') {
        (async () => {
          try {
            const result = await deleteInbox(message.inboxId);
            sendResponse(result);
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'getInboxes') {
        (async () => {
          try {
            const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            sendResponse({ success: true, inboxes });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'setProvider') {
        (async () => {
          try {
            await browser.storage.local.set({ selectedProvider: message.provider });
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'updateInboxTag') {
        (async () => {
          try {
            const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            const inboxIndex = inboxes.findIndex((i) => i.id === message.inboxId);
            if (inboxIndex === -1) {
              sendResponse({ success: false, error: 'Inbox not found' });
              return;
            }
            inboxes[inboxIndex].tag = message.tag;
            await browser.storage.local.set({ inboxes });
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'archiveInbox') {
        (async () => {
          try {
            const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            const inbox = inboxes.find((i) => i.id === message.inboxId);
            if (!inbox) {
              sendResponse({ success: false, error: 'Inbox not found' });
              return;
            }
            await archiveInboxEmails(inbox.address);
            const updatedInboxes = inboxes.map((i) =>
              i.id === message.inboxId ? { ...i, archived: true } : i
            );
            await browser.storage.local.set({ inboxes: updatedInboxes });
            sendResponse({ success: true });
          } catch (e) {
            logError('archiveInbox error:', e);
            sendResponse({ success: false, error: 'Failed to archive inbox' });
          }
        })();
        return true;
      }

      if (message.type === 'unarchiveInbox') {
        (async () => {
          try {
            const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            const inbox = inboxes.find((i) => i.id === message.inboxId);
            if (!inbox) {
              sendResponse({ success: false, error: 'Inbox not found' });
              return;
            }
            const updatedInboxes = inboxes.map((i) =>
              i.id === message.inboxId ? { ...i, archived: false } : i
            );
            await browser.storage.local.set({ inboxes: updatedInboxes });
            sendResponse({ success: true });
          } catch (e) {
            logError('unarchiveInbox error:', e);
            sendResponse({ success: false, error: 'Failed to unarchive inbox' });
          }
        })();
        return true;
      }

      if (message.type === 'getProvider') {
        (async () => {
          try {
            const { selectedProvider = 'burner' } = (await browser.storage.local.get([
              'selectedProvider',
            ])) as { selectedProvider?: string };
            sendResponse({ success: true, provider: selectedProvider });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'clearSessionCredentials') {
        (async () => {
          try {
            await browser.storage.session.remove('sessionCredentials');
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'updateSessionCredentials') {
        (async () => {
          try {
            const result = await handleUpdateSessionCredentials(message, sender);
            sendResponse(result);
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'getAnalytics') {
        (async () => {
          try {
            const analytics = await getAnalytics();
            sendResponse({ success: true, analytics });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getArchivedEmails') {
        (async () => {
          try {
            const archivedEmails = await getArchivedEmails(message.inboxAddress);
            sendResponse({ success: true, archivedEmails });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'hardReset') {
        (async () => {
          try {
            await browser.alarms.clearAll();
            await browser.storage.session.clear();
            try {
              if (self.caches) {
                const cacheNames = await self.caches.keys();
                for (const cacheName of cacheNames) {
                  await self.caches.delete(cacheName);
                }
              }
            } catch {
              /* non-critical */
            }
            await browser.storage.local.set({ lastHardReset: Date.now(), forceNewSessions: true });
            setupPeriodicEmailCheck(checkNewEmails);
            setupInboxExpiryCheck();
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getBurnerInstances') {
        (async () => {
          try {
            const instances = await getBurnerInstances();
            sendResponse({ success: true, instances });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'renewGuerrillaInbox') {
        (async () => {
          try {
            const { inboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            const inbox = inboxes.find((i) => i.id === message.inboxId);
            if (!inbox) {
              sendResponse({ success: false, error: 'Inbox not found' });
              return;
            }
            if (inbox.provider !== 'guerrilla') {
              sendResponse({
                success: false,
                error: 'Only Guerrilla Mail addresses can be renewed',
              });
              return;
            }
            await autoRenewGuerrillaInbox(inbox);
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'addCustomBurnerInstance') {
        (async () => {
          try {
            await addCustomBurnerInstance(message.instance);
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'removeCustomBurnerInstance') {
        (async () => {
          try {
            await removeCustomBurnerInstance(message.instanceId);
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getSelectedBurnerInstance') {
        (async () => {
          try {
            const instance = await getSelectedBurnerInstance();
            sendResponse({ success: true, instance });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (
        message.action === 'setSelectedBurnerInstance' ||
        message.action === 'setBurnerInstance'
      ) {
        (async () => {
          try {
            await browser.storage.local.set({ selectedBurnerInstance: message.instanceId });
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'initializeDefaultProvider') {
        (async () => {
          try {
            await initializeDefaultProvider();
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'guerrillaApiCall') {
        (async () => {
          try {
            const data = await guerrillaApiCall(
              message.func,
              message.params || {},
              'GET',
              message.sidToken
            );
            sendResponse({ success: true, data });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      console.warn('Unknown message type:', message.type);
      return false;
    }
  );

  browser.commands.onCommand.addListener(async (command: string) => {
    if (command === 'autofill-form') {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { type: 'autofillForm' });
        }
      } catch (error: unknown) {
        logError(
          'Error executing autofill command:',
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  });
}
