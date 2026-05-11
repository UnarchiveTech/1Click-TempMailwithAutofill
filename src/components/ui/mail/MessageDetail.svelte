<script lang="ts">
import DOMPurify from 'dompurify';
import IconBack from '@/components/icons/IconBack.svelte';
import IconCopy from '@/components/icons/IconCopy.svelte';
import IconEnvelope from '@/components/icons/IconEnvelope.svelte';
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
<div class="flex items-center justify-between px-1 py-2 border-b border-md-outline-variant">
  <button class="px-2 py-1 text-md-primary rounded-lg bg-transparent hover:bg-md-surface-variant transition-colors flex items-center gap-1" aria-label="Go back" onclick={onBack}>
    <IconBack class="w-4 h-4" />
    Back
  </button>
  <button class="px-2 py-1 text-md-primary rounded-lg bg-transparent hover:bg-md-surface-variant transition-colors flex items-center gap-1" aria-label="Forward message" onclick={_forwardMessage}>
    <IconEnvelope class="w-4 h-4" />
    Forward
  </button>
</div>
{/if}
{#if selectedMessage}
  <div class="flex-1 px-1 py-3 space-y-3">
    <div class="bg-md-surface-container-low rounded-xl">
      <div class="p-3">
        <div class="font-semibold text-sm">{selectedMessage.subject}</div>
        <div class="text-xs text-md-on-surface/60 mt-1">
          <div>From: {selectedMessage.from}</div>
          <div>{selectedMessage.time}</div>
        </div>
      </div>
    </div>
    {#if selectedMessage.isOtp}
      <div class="bg-md-primary/10 border border-md-primary/20 rounded-xl">
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-md-primary mb-1">Verification Code</div>
              <div class="text-2xl font-bold text-md-primary font-mono">{selectedMessage.otp}</div>
            </div>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-md-surface-variant transition-colors" aria-label="Copy OTP" onclick={() => navigator.clipboard.writeText(selectedMessage.otp)}>
              <IconCopy class="w-5 h-5 text-md-primary" />
            </button>
          </div>
        </div>
      </div>
    {/if}
    <div class="bg-md-surface-container-low rounded-xl">
      <div class="p-3">
        <div class="text-sm">{@html DOMPurify.sanitize(selectedMessage.body_html || `<pre>${selectedMessage.body || ''}</pre>`)}</div>
      </div>
    </div>
  </div>
{:else}
  <div class="flex-1 flex items-center justify-center text-md-on-surface/50">
    <div class="text-center">
      <p class="text-sm">No message selected</p>
    </div>
  </div>
{/if}
