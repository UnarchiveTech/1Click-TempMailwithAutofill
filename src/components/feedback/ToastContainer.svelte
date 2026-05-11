<script lang="ts">
import { toastStore } from '@/utils/toastStore';
import type { Toast } from './Toast.svelte';
import ToastComponent from './Toast.svelte';

let toasts = $state<Toast[]>([]);

$effect(() => {
  return toastStore.subscribe((newToasts) => {
    toasts = newToasts;
  });
});

function handleClose(id: string) {
  toastStore.remove(id);
}
</script>

<div class="absolute bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
  {#each toasts as toast (toast.id)}
    <div class="pointer-events-auto">
      <ToastComponent {toast} onClose={handleClose} />
    </div>
  {/each}
</div>
