<script lang="ts">
import type { SavedLogin } from '@/utils/types.js';

let {
  context = 'popup',
  onBack = () => {},
  savedLogins = [],
  onDelete = () => {},
} = $props<{
  context?: 'popup' | 'sidepanel' | 'app';
  onBack?: () => void;
  savedLogins?: SavedLogin[];
  onDelete?: (id: string) => void;
}>();

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
</script>

<div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
  {#if savedLogins.length === 0}
    <div class="text-center py-8 text-base-content/50">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m0 0c-1.1 0-2 .9-2 2s-.9 2-2 2-2-.9-2-2 2-4 2-4zm0 0c1.1 0 2-.9 2-2s.9-2 2-2 2 .9 2 2-2 4-2 4z"/>
      </svg>
      <p class="text-sm">No saved login info yet</p>
    </div>
  {:else}
    {#each savedLogins as login}
      <div class="card bg-base-200">
        <div class="card-body p-3">
          <div class="flex justify-between items-start">
            <div class="flex-1 space-y-2">
              <div class="font-semibold text-sm">{login.website}</div>
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span>Email: {login.email}</span>
                <button class="btn btn-ghost btn-xs btn-square" aria-label="Copy email" onclick={() => copyToClipboard(login.email)}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span>Password: {login.password}</span>
                <button class="btn btn-ghost btn-xs btn-square" aria-label="Copy password" onclick={() => copyToClipboard(login.password)}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              {#if login.otp}
                <div class="flex items-center gap-2 text-xs text-primary">
                  <span>OTP: {login.otp}</span>
                  <button class="btn btn-ghost btn-xs btn-square" aria-label="Copy OTP" onclick={() => copyToClipboard(login.otp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
            <button class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete login" onclick={() => onDelete(login.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
