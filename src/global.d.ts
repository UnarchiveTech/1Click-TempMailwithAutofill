// WXT provides browser and chrome globals with proper types.
type Browser = import('wxt/browser').Browser;

declare const browser: Browser;
declare const chrome: Browser;

// CSS imports
declare module '*.css';

// webextension-polyfill
declare module 'webextension-polyfill' {
  const browser: Browser;
  export default browser;
}
