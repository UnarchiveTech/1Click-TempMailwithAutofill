import '@types/webextension-polyfill';

declare module 'webextension-polyfill' {
  namespace browser.storage {
    interface StorageArea {
      get(keys?: any): Promise<any>;
    }
  }
}
