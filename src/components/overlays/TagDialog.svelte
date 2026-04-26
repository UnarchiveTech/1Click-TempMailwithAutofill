<script lang="ts">
interface Props {
  open: boolean;
  currentTag: string | null;
  existingTags: string[];
  onClose: () => void;
  onSave: (tag: string) => void;
}
let { open, currentTag, existingTags, onClose, onSave }: Props = $props();

let tagInput = $state('');
let selectedExistingTag = $state<string | null>(null);

// Initialize with current tag when dialog opens
$effect(() => {
  if (open && currentTag) {
    tagInput = currentTag;
    selectedExistingTag = currentTag;
  } else if (open) {
    tagInput = '';
    selectedExistingTag = null;
  }
});

function handleSave() {
  const tagToSave = selectedExistingTag || tagInput.trim();
  if (tagToSave) {
    onSave(tagToSave);
  }
}

function selectExistingTag(tag: string) {
  selectedExistingTag = tag;
  tagInput = tag;
}

function clearSelection() {
  selectedExistingTag = null;
  tagInput = '';
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
      class="relative z-10 bg-base-100 rounded-xl shadow-2xl p-5 flex flex-col gap-4 w-80 max-h-[500px]"
      tabindex="-1"
    >
      <div>
        <h3 class="font-bold text-base mb-1">Set Tag</h3>
        <p class="text-xs text-base-content/60">Enter a custom tag or select an existing one</p>
      </div>

      <!-- Input field -->
      <div class="flex items-center gap-2">
        <input
          type="text"
          class="input input-sm input-bordered flex-1 rounded-lg"
          placeholder="Enter tag name..."
          bind:value={tagInput}
          oninput={() => {
            // Clear selected existing tag when user types in input
            if (selectedExistingTag && tagInput !== selectedExistingTag) {
              selectedExistingTag = null;
            }
          }}
          onkeydown={(e) => {
            if (e.key === 'Enter') handleSave();
            else if (e.key === 'Escape') onClose();
          }}
        />
        {#if selectedExistingTag || tagInput}
          <button
            class="btn btn-sm btn-ghost btn-square rounded-lg"
            aria-label="Clear"
            onclick={clearSelection}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>

      <!-- Existing tags -->
      {#if existingTags.length > 0}
        <div>
          <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Existing Tags</p>
          <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {#each existingTags as tag}
              <button
                class="btn btn-xs {selectedExistingTag === tag ? 'btn-primary' : 'btn-ghost'} rounded-full"
                onclick={() => selectExistingTag(tag)}
              >
                {tag}
              </button>
            {/each}
          </div>
        </div>
      {/if}

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
          aria-label="Save tag"
          onclick={handleSave}
          disabled={!tagInput.trim()}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
