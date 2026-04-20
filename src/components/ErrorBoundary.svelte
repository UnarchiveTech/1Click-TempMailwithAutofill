<script lang="ts">
  import type { Snippet } from 'svelte';
  
  let { error = null, reset = () => {}, children }: { error: Error | null, reset: () => void, children: Snippet } = $props();
</script>

{#if error}
  <div class="flex items-center justify-center min-h-screen bg-error/10 p-4">
    <div class="max-w-md w-full bg-base-100 rounded-lg shadow-lg p-6">
      <div class="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="text-xl font-bold text-error">Something went wrong</h2>
      </div>
      <p class="text-base-content/70 mb-4">
        An unexpected error occurred. You can try refreshing the page or resetting the application.
      </p>
      {#if error.message}
        <details class="bg-base-200 rounded p-3 mb-4">
          <summary class="cursor-pointer font-medium text-sm text-base-content/60">Error details</summary>
          <pre class="mt-2 text-xs text-base-content/50 overflow-auto">{error.message}</pre>
        </details>
      {/if}
      <div class="flex gap-2">
        <button class="btn btn-sm btn-primary flex-1" onclick={() => reset()}>
          Try Again
        </button>
        <button class="btn btn-sm btn-ghost" onclick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
