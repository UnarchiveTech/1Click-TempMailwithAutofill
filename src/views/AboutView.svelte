<script lang="ts">
import { browser } from 'wxt/browser';
import AppLogo from '@/components/icons/AppLogo.svelte';

interface Props {
  context?: 'popup' | 'sidepanel' | 'app';
  version: string;
}
let { context = 'popup', version }: Props = $props();
</script>

<div class="flex flex-col h-full">
  <div class="flex flex-col items-center gap-5 px-6 py-8">
    <AppLogo />
    <div class="text-center">
      <h2 class="font-bold text-base">1Click — Temp Mail & Autofill</h2>
      <span class="badge badge-soft badge-primary mt-1">v{version}</span>
    </div>
    <p class="text-sm text-base-content/60 text-center leading-relaxed">
      A privacy-focused Chrome extension for generating temporary email addresses and auto-filling web forms.
    </p>
    <div class="flex flex-col gap-2 w-full">
      <a
        href="https://github.com/UnarchiveTech/1Click-TempMailwithAutofill"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-outline btn-sm w-full gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
        View on GitHub
      </a>
      <button
        class="btn btn-soft btn-error btn-sm w-full gap-2"
        onclick={() => browser.tabs.create({ url: 'https://github.com/UnarchiveTech/1Click-TempMailwithAutofill/issues/new' })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        Report an Issue
      </button>
    </div>
    <p class="text-xs text-base-content/40 mt-2">Made with ❤️ by UnarchiveTech</p>
  </div>
</div>
