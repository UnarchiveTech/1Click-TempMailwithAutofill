<script lang="ts">
interface Props {
  confirmDialog: { message: string; onConfirm: () => void } | null;
  confirmDialogRef?: HTMLElement | null;
  onClose: () => void;
}
let { confirmDialog, confirmDialogRef = $bindable(null), onClose }: Props = $props();
</script>

{#if confirmDialog}
  <div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
    <div class="modal-box" bind:this={confirmDialogRef} tabindex="-1">
      <h3 id="confirm-dialog-title" class="font-bold text-lg mb-4">Confirm Action</h3>
      <p class="py-4">{confirmDialog.message}</p>
      <div class="flex justify-end gap-2">
        <button class="btn btn-sm" aria-label="Cancel action" onclick={onClose}>Cancel</button>
        <button class="btn btn-sm btn-error" aria-label="Confirm action" onclick={confirmDialog.onConfirm}>Confirm</button>
      </div>
    </div>
    <button class="modal-backdrop" aria-label="Close dialog" onclick={onClose}></button>
  </div>
{/if}
