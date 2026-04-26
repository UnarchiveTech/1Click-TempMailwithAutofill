<script lang="ts">
import DOMPurify from 'dompurify';
import type { Email } from '@/utils/types.js';

let { onBack = () => {}, selectedMessage = null } = $props<{
  onBack?: () => void;
  selectedMessage?: Email | null;
}>();

function _forwardMessage() {
  if (!selectedMessage) return;

  const subject = encodeURIComponent(`Fwd: ${selectedMessage.subject || 'No Subject'}`);
  const body = encodeURIComponent(
    `\n\n--- Forwarded Message ---\n` +
      `From: ${selectedMessage.from || 'Unknown Sender'}\n` +
      `Date: ${selectedMessage.time || 'Unknown'}\n` +
      `Subject: ${selectedMessage.subject || 'No Subject'}\n\n` +
      `${selectedMessage.body || 'No content'}`
  );
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  window.open(mailtoLink, '_self');
}
</script>

{#if selectedMessage}
<div class="flex items-center justify-between px-4 py-2 border-b border-base-200">
  <button class="btn btn-ghost btn-sm gap-1 px-2" aria-label="Go back" onclick={onBack}>
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
    </svg>
    Back
  </button>
  <button class="btn btn-ghost btn-sm gap-1 px-2" aria-label="Forward message" onclick={_forwardMessage}>
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    Forward
  </button>
</div>
{/if}
{#if selectedMessage}
  <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
    <div class="card bg-base-200">
      <div class="card-body p-3">
        <div class="font-semibold text-sm">{selectedMessage.subject}</div>
        <div class="text-xs text-base-content/60 mt-1">
          <div>From: {selectedMessage.from}</div>
          <div>{selectedMessage.time}</div>
        </div>
      </div>
    </div>
    {#if selectedMessage.isOtp}
      <div class="card bg-info/10 border-info/20">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-info mb-1">Verification Code</div>
              <div class="text-2xl font-bold text-info font-mono">{selectedMessage.otp}</div>
            </div>
            <button class="btn btn-sm btn-ghost btn-square" aria-label="Copy OTP" onclick={() => navigator.clipboard.writeText(selectedMessage.otp)}>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
    <div class="card bg-base-200">
      <div class="card-body p-3">
        <div class="text-sm">{@html DOMPurify.sanitize(selectedMessage.body)}</div>
      </div>
    </div>
  </div>
{:else}
  <div class="flex-1 flex items-center justify-center text-base-content/50">
    <div class="text-center">
      <p class="text-sm">No message selected</p>
    </div>
  </div>
{/if}
