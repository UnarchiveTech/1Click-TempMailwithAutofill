import { mount } from 'svelte';
import App from '../../App.svelte';
import '../../app.css';

// Cross-browser support: use webextension-polyfill, fallback to chrome
async function init() {
  let api: any;
  try {
    const browser = await import('webextension-polyfill');
    api = browser.default;
  } catch (e) {
    api = (window as any).chrome;
  }
  (window as any).browser = api;
  (window as any).chrome = api;
  mount(App, {
    target: document.getElementById('app')!,
  });
}
init();
