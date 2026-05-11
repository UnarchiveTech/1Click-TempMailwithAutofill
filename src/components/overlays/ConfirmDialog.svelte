<script lang="ts">
import { setupFocusTrap } from '@/utils/focusTrap.js';

interface Props {
  confirmDialog: { message: string; onConfirm: () => void } | null;
  confirmDialogRef?: HTMLElement | null;
  onClose: () => void;
}
let { confirmDialog, confirmDialogRef = $bindable(null), onClose }: Props = $props();

let dialogRef = $state<HTMLElement | null>(null);
let cleanupFocusTrap: (() => void) | null = null;

// Setup focus trap when dialog opens
$effect(() => {
  if (confirmDialog && dialogRef) {
    setTimeout(() => {
      if (dialogRef) {
        cleanupFocusTrap = setupFocusTrap(dialogRef);
      }
    }, 50);
  }
  return () => {
    if (cleanupFocusTrap) {
      cleanupFocusTrap();
      cleanupFocusTrap = null;
    }
  };
});
</script>

{#if confirmDialog}
  <div class="absolute inset-0 z-50 flex items-center justify-center bg-md-surface/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
    <div class="bg-md-surface rounded-xl px-4 py-2 shadow-xl p-6 max-w-md w-full" bind:this={dialogRef} tabindex="-1">
      <h3 id="confirm-dialog-title" class="font-bold text-lg mb-4">Confirm Action</h3>
      <p class="py-4">{confirmDialog.message}</p>
      <div class="flex justify-end gap-2">
        <button class="px-3 py-1.5 text-sm rounded-lg bg-md-secondary text-md-on-secondary hover:bg-md-secondary/90 transition-colors" aria-label="Cancel action" onclick={onClose}>Cancel</button>
        <button class="px-3 py-1.5 text-sm rounded-lg bg-md-error text-md-on-error hover:bg-md-error/90 transition-colors" aria-label="Confirm action" onclick={confirmDialog.onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
{/if}
