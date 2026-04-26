<script lang="ts">
interface Props {
  open: boolean;
  currentUsername: string;
  domain: string;
  onClose: () => void;
  onSave: (username: string) => void;
}

let { open, currentUsername, domain, onClose, onSave }: Props = $props();

let usernameInput = $state('');

// Initialize with current username when dialog opens
$effect(() => {
  if (open) {
    usernameInput = currentUsername;
  }
});

function handleSave() {
  const trimmedUsername = usernameInput.trim();
  if (trimmedUsername && trimmedUsername !== currentUsername) {
    onSave(trimmedUsername);
  }
}
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
    <div
      class="absolute inset-0 bg-base-content/30 backdrop-blur-sm"
      role="button"
      tabindex="-1"
      onclick={onClose}
      onkeydown={(e) => e.key === 'Escape' && onClose()}
    ></div>

    <button
      class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center shadow-md transition-colors"
      aria-label="Close dialog"
      onclick={onClose}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <div
      class="relative z-10 bg-base-100 rounded-xl shadow-2xl p-5 flex flex-col gap-4 w-96"
      tabindex="-1"
    >
      <div>
        <h3 class="font-bold text-base mb-1">Edit Email Address</h3>
        <p class="text-xs text-base-content/60">Change your username (domain will remain {domain})</p>
      </div>

      <!-- Input field -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input input-sm input-bordered flex-1 rounded-lg"
            placeholder="Enter new username..."
            bind:value={usernameInput}
            onkeydown={(e) => {
              if (e.key === 'Enter') handleSave();
              else if (e.key === 'Escape') onClose();
            }}
          />
          <span class="text-xs text-base-content/50">@{domain}</span>
        </div>
        <p class="text-xs text-base-content/40">Current: {currentUsername}@{domain}</p>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 pt-2">
        <button
          class="btn btn-sm flex-1 rounded-xl"
          aria-label="Cancel"
          onclick={onClose}
        >
          Cancel
        </button>
        <button
          class="btn btn-sm btn-primary flex-1 rounded-xl"
          aria-label="Save email address"
          onclick={handleSave}
          disabled={!usernameInput.trim() || usernameInput.trim() === currentUsername}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
