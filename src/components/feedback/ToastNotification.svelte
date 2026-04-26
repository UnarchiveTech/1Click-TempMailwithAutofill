<script lang="ts">
interface Props {
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning';
    icon?: 'success' | 'error' | 'warning' | 'expired' | 'archived' | 'deleted' | 'info';
    undoAction?: (() => void) | null;
  } | null;
  formDetected?: boolean;
}
let { toast, formDetected = false }: Props = $props();

function getIconPath(icon: string) {
  switch (icon) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'error':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z';
    case 'expired':
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'archived':
      return 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4';
    case 'deleted':
      return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
    case 'info':
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
}
</script>

{#if toast}
  <div class="toast toast-center {formDetected ? 'toast-top mt-20' : 'toast-bottom mb-20'}">
    <div
      class="alert rounded-xl flex items-center gap-3 px-4 py-3 shadow-lg"
      style="background-color: var(--color-primary, #2563EB); color: white;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath(toast.icon || toast.type)}/>
      </svg>
      <span class="flex-1">{toast.message}</span>
      {#if toast.undoAction}
        <button class="btn btn-sm btn-ghost text-white hover:bg-white/20" onclick={toast.undoAction}>Undo</button>
      {/if}
    </div>
  </div>
{/if}
