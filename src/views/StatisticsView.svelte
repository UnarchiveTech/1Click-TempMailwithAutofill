<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import IconBarChart from '@/components/icons/IconBarChart.svelte';
import IconRefresh from '@/components/icons/IconRefresh.svelte';
import type { Analytics } from '@/utils/types.js';

let {
  context = 'popup',
  onBack = () => {},
  analytics = {
    createdAt: undefined,
    accountsCreated: 0,
    emailsReceived: 0,
    otpsDetected: 0,
    notificationsSent: 0,
  },
  loading = false,
  onLoadAnalytics = () => {},
} = $props<{
  context?: 'popup' | 'sidepanel' | 'app';
  onBack?: () => void;
  analytics?: Analytics;
  loading?: boolean;
  onLoadAnalytics?: () => void;
}>();

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMount(() => {
  // Auto-refresh analytics every 30 seconds
  refreshInterval = setInterval(() => {
    onLoadAnalytics();
  }, 30000);
  // Load immediately on mount
  onLoadAnalytics();
});

onDestroy(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

{#if loading}
  <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
    {#each [1,2,3,4] as _}
      <div class="rounded-xl bg-base-100 p-4 space-y-2 animate-pulse">
        <div class="h-3 w-24 bg-base-300 rounded"></div>
        <div class="h-8 w-32 bg-base-300 rounded"></div>
      </div>
    {/each}
  </div>
{:else}
<div class="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-20">

  <!-- Page heading -->
  <div class="pt-1">
    <h1 class="text-lg font-bold text-base-content">Statistics</h1>
    <p class="text-xs text-base-content/50 mt-0.5">Your extension usage metrics.</p>
  </div>

  <!-- ── Stats Cards ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconBarChart class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Overview</span>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Inboxes Created</div>
        <div class="text-xs text-base-content/50">Total temporary addresses</div>
      </div>
      <div class="text-2xl font-bold text-primary">{analytics.accountsCreated}</div>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Emails Received</div>
        <div class="text-xs text-base-content/50">Messages fetched</div>
      </div>
      <div class="text-2xl font-bold text-secondary">{analytics.emailsReceived}</div>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">OTPs Detected</div>
        <div class="text-xs text-base-content/50">Verification codes found</div>
      </div>
      <div class="text-2xl font-bold text-accent">{analytics.otpsDetected}</div>
    </div>

    <div class="bg-base-100 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <div class="text-sm font-medium text-base-content">Notifications Sent</div>
        <div class="text-xs text-base-content/50">Browser alerts triggered</div>
      </div>
      <div class="text-2xl font-bold text-info">{analytics.notificationsSent}</div>
    </div>
  </section>

  <!-- ── Since Info ── -->
  {#if analytics.createdAt}
    <div class="bg-base-100 rounded-xl px-4 py-3">
      <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Tracking Since</div>
      <div class="text-sm text-base-content">{new Date(analytics.createdAt).toLocaleDateString()}</div>
    </div>
  {/if}

  <!-- ── Refresh Button ── -->
  <button class="w-full btn btn-outline rounded-xl h-12 text-sm font-semibold" onclick={onLoadAnalytics}>
    <IconRefresh class="w-4 h-4 mr-2" />
    Refresh Analytics
  </button>

</div>
{/if}
