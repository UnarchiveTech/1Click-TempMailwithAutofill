<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import IconBarChart from '@/components/icons/IconBarChart.svelte';
import IconBell from '@/components/icons/IconBell.svelte';
import IconClock from '@/components/icons/IconClock.svelte';
import IconEnvelope from '@/components/icons/IconEnvelope.svelte';
import IconMail from '@/components/icons/IconMail.svelte';
import IconRefresh from '@/components/icons/IconRefresh.svelte';
import { getActivityEvents } from '@/utils/activity-tracker.js';
import type { ActivityEvent, Analytics } from '@/utils/types.js';

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
let activityEvents = $state<ActivityEvent[]>([]);
let loadingEvents = $state(false);

async function loadActivityEvents() {
  loadingEvents = true;
  activityEvents = await getActivityEvents();
  loadingEvents = false;
}

onMount(() => {
  // Auto-refresh analytics every 30 seconds
  refreshInterval = setInterval(() => {
    onLoadAnalytics();
    loadActivityEvents();
  }, 30000);
  // Load immediately on mount
  onLoadAnalytics();
  loadActivityEvents();
});

onDestroy(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

function getEventIcon(type: ActivityEvent['type']) {
  switch (type) {
    case 'email_received':
      return IconMail;
    case 'otp_detected':
      return IconEnvelope;
    case 'notification_sent':
      return IconBell;
    case 'account_created':
      return IconBarChart;
    case 'account_deleted':
      return IconBarChart;
    case 'auto_fill':
      return IconClock;
    default:
      return IconMail;
  }
}

function getEventTitle(type: ActivityEvent['type'], data: ActivityEvent['data']) {
  switch (type) {
    case 'email_received':
      return `New email from ${data.sender || 'Unknown'}`;
    case 'otp_detected':
      return `OTP detected from ${data.sender || 'Unknown'}`;
    case 'notification_sent':
      return `Notification sent for ${data.sender || 'Unknown'}`;
    case 'account_created':
      return `Account created: ${data.inboxAddress}`;
    case 'account_deleted':
      return `Account deleted: ${data.inboxAddress}`;
    case 'auto_fill':
      return `Auto-filled OTP for ${data.website}`;
    default:
      return 'Unknown event';
  }
}

function getEventSubtitle(type: ActivityEvent['type'], data: ActivityEvent['data']) {
  switch (type) {
    case 'email_received':
      return data.subject || 'No subject';
    case 'otp_detected':
      return data.subject || 'No subject';
    case 'notification_sent':
      return data.subject || 'No subject';
    case 'account_created':
      return data.inboxAddress;
    case 'account_deleted':
      return data.inboxAddress;
    case 'auto_fill':
      return data.website;
    default:
      return '';
  }
}

function formatTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
</script>

{#if loading}
  <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4" style="scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;">
    {#each [1,2,3,4] as _}
      <div class="rounded-xl bg-base-100 p-4 space-y-2 animate-pulse">
        <div class="h-3 w-24 bg-base-300 rounded"></div>
        <div class="h-8 w-32 bg-base-300 rounded"></div>
      </div>
    {/each}
  </div>
{:else}
<div class="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-20" style="scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;">

  <!-- Page heading -->
  <div class="pt-1">
    <h1 class="text-lg font-bold text-base-content">Activity</h1>
    <p class="text-xs text-base-content/50 mt-0.5">Your extension usage and timeline.</p>
  </div>

  <!-- ── Summary Stats Cards ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconBarChart class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Summary</span>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="bg-base-100 rounded-xl px-3 py-3 flex flex-col items-center justify-center">
        <div class="text-2xl font-bold text-primary">{analytics.accountsCreated}</div>
        <div class="text-xs text-base-content/50">Inboxes</div>
      </div>

      <div class="bg-base-100 rounded-xl px-3 py-3 flex flex-col items-center justify-center">
        <div class="text-2xl font-bold text-secondary">{analytics.emailsReceived}</div>
        <div class="text-xs text-base-content/50">Emails</div>
      </div>

      <div class="bg-base-100 rounded-xl px-3 py-3 flex flex-col items-center justify-center">
        <div class="text-2xl font-bold text-accent">{analytics.otpsDetected}</div>
        <div class="text-xs text-base-content/50">OTPs</div>
      </div>

      <div class="bg-base-100 rounded-xl px-3 py-3 flex flex-col items-center justify-center">
        <div class="text-2xl font-bold text-info">{analytics.notificationsSent}</div>
        <div class="text-xs text-base-content/50">Notifications</div>
      </div>
    </div>
  </section>

  <!-- ── Activity Timeline ── -->
  <section class="space-y-2">
    <div class="flex items-center gap-2 mb-1">
      <IconClock class="w-4 h-4 text-primary" />
      <span class="text-sm font-semibold text-base-content">Recent Activity</span>
    </div>

    {#if loadingEvents}
      <div class="space-y-2">
        {#each [1,2,3] as _}
          <div class="rounded-xl bg-base-100 p-4 space-y-2 animate-pulse">
            <div class="h-3 w-24 bg-base-300 rounded"></div>
            <div class="h-4 w-32 bg-base-300 rounded"></div>
          </div>
        {/each}
      </div>
    {:else if activityEvents.length === 0}
      <div class="bg-base-100 rounded-xl px-4 py-6 text-center">
        <div class="text-sm text-base-content/50">No activity yet</div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each activityEvents as event}
          {#if event.type === 'email_received'}
            <div class="bg-base-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <div class="mt-0.5">
                <IconMail class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-base-content truncate">
                  {getEventTitle(event.type, event.data)}
                </div>
                <div class="text-xs text-base-content/50 truncate">
                  {getEventSubtitle(event.type, event.data)}
                </div>
                <div class="text-[10px] text-base-content/40 mt-1">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          {:else if event.type === 'otp_detected'}
            <div class="bg-base-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <div class="mt-0.5">
                <IconEnvelope class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-base-content truncate">
                  {getEventTitle(event.type, event.data)}
                </div>
                <div class="text-xs text-base-content/50 truncate">
                  {getEventSubtitle(event.type, event.data)}
                </div>
                <div class="text-[10px] text-base-content/40 mt-1">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          {:else if event.type === 'notification_sent'}
            <div class="bg-base-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <div class="mt-0.5">
                <IconBell class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-base-content truncate">
                  {getEventTitle(event.type, event.data)}
                </div>
                <div class="text-xs text-base-content/50 truncate">
                  {getEventSubtitle(event.type, event.data)}
                </div>
                <div class="text-[10px] text-base-content/40 mt-1">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          {:else if event.type === 'account_created'}
            <div class="bg-base-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <div class="mt-0.5">
                <IconBarChart class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-base-content truncate">
                  {getEventTitle(event.type, event.data)}
                </div>
                <div class="text-xs text-base-content/50 truncate">
                  {getEventSubtitle(event.type, event.data)}
                </div>
                <div class="text-[10px] text-base-content/40 mt-1">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          {:else}
            <div class="bg-base-100 rounded-xl px-4 py-3 flex items-start gap-3">
              <div class="mt-0.5">
                <IconMail class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-base-content truncate">
                  {getEventTitle(event.type, event.data)}
                </div>
                <div class="text-xs text-base-content/50 truncate">
                  {getEventSubtitle(event.type, event.data)}
                </div>
                <div class="text-[10px] text-base-content/40 mt-1">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </section>

  <!-- ── Since Info ── -->
  {#if analytics.createdAt}
    <div class="bg-base-100 rounded-xl px-4 py-3">
      <div class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wider mb-1.5">Tracking Since</div>
      <div class="text-sm text-base-content">{new Date(analytics.createdAt).toLocaleDateString()}</div>
    </div>
  {/if}

  <!-- ── Refresh Button ── -->
  <button class="w-full btn btn-outline rounded-xl h-12 text-sm font-semibold" onclick={() => { onLoadAnalytics(); loadActivityEvents(); }}>
    <IconRefresh class="w-4 h-4 mr-2" />
    Refresh
  </button>

</div>
{/if}
