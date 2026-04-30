/**
 * Runtime message handler — routes incoming messages to the appropriate module functions
 */

import { DEFAULT_PROVIDER, EmailService, loadProviderConfig } from '@/services/email-service.js';
import {
  addCustomProviderInstance,
  getProviderInstances,
  getSelectedProviderInstance,
  initializeDefaultProvider,
  removeCustomProviderInstance,
} from '@/utils/instance-manager.js';
import { logError, logInfo } from '@/utils/logger.js';
import type { Account, ProviderInstance } from '@/utils/types.js';
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

export function registerMessageHandler(): void {
  browser.runtime.onMessage.addListener(
    // biome-ignore lint/suspicious/noExplicitAny: Chrome runtime message types
    (message: any, sender: any, sendResponse: (response: any) => void) => {
      logInfo('Received message:', { message });

      if (message.type === 'createInbox') {
        (async () => {
          try {
            const { selectedProvider } = (await browser.storage.local.get([
              'selectedProvider',
            ])) as { selectedProvider?: string };
            const provider = message.provider || selectedProvider;
            const instanceId = message.instanceId;

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
            if (message.color) {
              inboxes[inboxIndex].tagColor = message.color;
            }
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
            const { selectedProvider } = (await browser.storage.local.get([
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

      if (message.action === 'getProviderInstances') {
        (async () => {
          try {
            const provider = message.provider || DEFAULT_PROVIDER;
            const instances = await getProviderInstances(provider);
            sendResponse({ success: true, instances });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.type === 'renewInbox') {
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
            const providerConfig = loadProviderConfig(inbox.provider);
            if (!providerConfig.expiry?.renewable) {
              sendResponse({
                success: false,
                error: 'This provider does not support inbox renewal',
              });
              return;
            }
            // Auto-renew inbox using provider config
            const config = loadProviderConfig(inbox.provider);
            const service = new EmailService(config, browser);

            if (!inbox.sidToken) {
              sendResponse({ success: false, error: 'No sidToken available for renewal' });
              return;
            }

            const currentUser = inbox.address.split('@')[0];
            const newEmailResponse = await service.executeOperation('createInbox', {
              forceNewSession: true,
            });

            if (!newEmailResponse.token) {
              sendResponse({ success: false, error: 'Failed to get fresh token for renewal' });
              return;
            }

            const newSidToken = newEmailResponse.token as string;

            // Call renewal operation from config
            if (providerConfig.expiry?.renewalMethod) {
              await service.executeOperation(providerConfig.expiry.renewalMethod, {
                auth: { token: newSidToken },
                variables: { emailUser: currentUser },
              });
            }

            const { inboxes: allInboxes = [] } = (await browser.storage.local.get(['inboxes'])) as {
              inboxes?: Account[];
            };
            const inboxIndex = allInboxes.findIndex((i: Account) => i.id === inbox.id);

            if (inboxIndex !== -1) {
              const timestamp = newEmailResponse.timestamp as number;
              const expiryConfig = loadProviderConfig(inbox.provider);
              const updatedInbox = {
                ...allInboxes[inboxIndex],
                sidToken: newSidToken,
                expiresAt:
                  ((timestamp || 0) + (expiryConfig.expiry?.duration || 3600000) / 1000) * 1000,
                expiryNotified: false,
              };

              allInboxes[inboxIndex] = updatedInbox;
              await browser.storage.local.set({ inboxes: allInboxes });
            }

            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getProviderInstances') {
        (async () => {
          try {
            const provider = message.provider || DEFAULT_PROVIDER;
            const instances = await getProviderInstances(provider);
            sendResponse({ success: true, instances });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'addCustomInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            await addCustomProviderInstance(
              provider,
              message.instance as Omit<ProviderInstance, 'id' | 'isCustom'>
            );
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'removeCustomInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            await removeCustomProviderInstance(provider, message.instanceId as string);
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getSelectedInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            const instance = await getSelectedProviderInstance(provider);
            sendResponse({ success: true, instance });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'setSelectedInstance' || message.action === 'setInstance') {
        (async () => {
          try {
            await browser.storage.local.set({ selectedInstance: message.instanceId });
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
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            await addCustomProviderInstance(
              provider,
              message.instance as Omit<ProviderInstance, 'id' | 'isCustom'>
            );
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'removeCustomProviderInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            await removeCustomProviderInstance(provider, message.instanceId as string);
            sendResponse({ success: true });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'getSelectedProviderInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            const instance = await getSelectedProviderInstance(provider);
            sendResponse({ success: true, instance });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: msg });
          }
        })();
        return true;
      }

      if (message.action === 'setSelectedProviderInstance') {
        (async () => {
          try {
            const { selectedProvider } = await browser.storage.local.get(['selectedProvider']);
            const provider = (selectedProvider as string) || DEFAULT_PROVIDER;
            const storageKey = `selectedInstance_${provider}`;
            await browser.storage.local.set({ [storageKey]: message.instanceId });
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

      if (message.action === 'providerApiCall') {
        (async () => {
          try {
            const config = loadProviderConfig(message.provider);
            const service = new EmailService(config, browser);
            const data = await service.executeOperation(message.func, {
              auth: message.sidToken ? { token: message.sidToken } : undefined,
              variables: message.params || {},
            });
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
          await browser.tabs.sendMessage(tab.id, { type: 'autofillForm' }).catch(() => {
            // Ignore if content script not loaded in the tab
          });
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
