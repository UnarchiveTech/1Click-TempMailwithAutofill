import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { initializeAnalytics } from './inbox/analytics.js';
import {
  checkNewEmails,
  setupInboxExpiryCheck,
  setupPeriodicEmailCheck,
} from './inbox/inbox-manager.js';
import { initializeDefaultProvider } from './providers/provider-registry.js';
import { registerMessageHandler } from './runtime/message-handler.js';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details: { reason: string }) => {
    if (details.reason === 'install') {
      browser.storage.local.clear().then(() => {
        initializeAnalytics();
        setupPeriodicEmailCheck(checkNewEmails);
        setupInboxExpiryCheck();
        initializeDefaultProvider();
      });
    } else {
      initializeAnalytics();
      setupPeriodicEmailCheck(checkNewEmails);
      setupInboxExpiryCheck();
      initializeDefaultProvider();
    }
  });

  registerMessageHandler();
});
