<script lang="ts">
import IconAutoRenew from '@/components/icons/IconAutoRenew.svelte';

interface Props {
  expiryTime: number; // Time remaining in minutes
  autoRenew: boolean;
  maxExpiryTime?: number; // Maximum expiry time for full progress (default: 60 minutes)
  onToggleAutoRenew?: () => void;
  themeColor?: string; // Primary theme color (default: Indigo #6366F1)
}

const {
  expiryTime,
  autoRenew,
  maxExpiryTime = 60,
  onToggleAutoRenew,
  themeColor = 'var(--color-primary)',
}: Props = $props();

// Calculate progress percentage (0-100)
const progressPercentage = $derived(Math.min(Math.max((expiryTime / maxExpiryTime) * 100, 0), 100));

// Calculate time remaining text
const timeText = $derived(`${Math.ceil(expiryTime)}m`);

// Status text based on auto-renew state
const statusText = $derived(autoRenew ? `Auto-renews in ${timeText}` : `Expires in ${timeText}`);

// Icon color based on auto-renew state
const iconColorClass = $derived(
  autoRenew ? 'text-[var(--theme-primary)]' : 'text-slate-400 dark:text-slate-500'
);

// Build the conic gradient: theme color sweeps clockwise to show progress, base color fills the rest
const borderGradient = $derived(
  `conic-gradient(from -90deg, ${themeColor} 0% ${progressPercentage}%, var(--ep-border-base) ${progressPercentage}% 100%)`
);
</script>

<style>
  /* Outer wrapper shows the conic gradient as the visible border */
  .expiry-pill-outer {
    display: inline-flex;
    padding: 2px;
    border-radius: 9999px;
    background: var(--border-gradient);
  }

  /* Inner content area — opaque background hides the gradient in the center */
  .expiry-pill {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    background: var(--ep-bg);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 116px;
    height: 18px;
    color: var(--ep-text);
  }

  :global(:root) {
    --ep-border-base: var(--color-base-300);
    --ep-bg: var(--color-base-100);
    --ep-text: var(--color-base-content);
  }

  :global(.dark) {
    --ep-border-base: var(--color-base-300);
    --ep-bg: var(--color-base-100);
    --ep-text: var(--color-base-content);
  }

  .clock-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem;
    border-radius: 0.75rem;
    cursor: pointer;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .clock-button:hover {
    background-color: rgba(99, 102, 241, 0.15);
  }

  .icon-display {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 0.75rem;
  }

  .status-text {
    font-size: 0.625rem;
    font-weight: 500;
    color: currentColor;
    padding-right: 0.25rem;
    white-space: nowrap;
  }
</style>

<div
  class="expiry-pill-outer"
  style="--border-gradient: {borderGradient}; --theme-primary: {themeColor};"
>
  <div class="expiry-pill">
    {#if onToggleAutoRenew}
      <button
        class="clock-button {iconColorClass}"
        onclick={onToggleAutoRenew}
        title={autoRenew ? 'Disable auto-renew' : 'Enable auto-renew'}
      >
        <IconAutoRenew />
      </button>
    {:else}
      <div class="icon-display {iconColorClass}">
        <IconAutoRenew />
      </div>
    {/if}
    <span class="status-text">{statusText}</span>
  </div>
</div>
