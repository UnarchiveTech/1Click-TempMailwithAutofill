<script lang="ts">
  let {
    onBack = () => {},
    currentEmailDetail = null,
    emails = [],
    loading = false,
    onOpenMessageDetail = () => {},
    onRefreshMessages = () => {},
    onExportEmail = () => {}
  } = $props<{
    onBack?: () => void;
    currentEmailDetail?: any;
    emails?: any[];
    loading?: boolean;
    onOpenMessageDetail?: (mail: any) => void;
    onRefreshMessages?: () => void;
    onExportEmail?: () => void;
  }>();
</script>

<div class="flex items-center justify-end gap-2 px-4 py-2 border-b border-base-200">
  <button class="btn btn-ghost btn-sm btn-square tooltip" data-tip="Refresh Messages" aria-label="Refresh messages" onclick={onRefreshMessages}>
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
  </button>
  <button class="btn btn-ghost btn-sm btn-square tooltip" data-tip="Export Emails" aria-label="Export emails" onclick={onExportEmail}>
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  </button>
</div>
{#if currentEmailDetail}
  <div class="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
    <div class="font-mono text-sm font-bold">{currentEmailDetail.address}</div>
    <div class="text-xs text-base-content/60">Provider: {currentEmailDetail.provider}</div>
    <div class="text-xs text-primary">Received Mails: {currentEmailDetail.received}</div>
    <div class="text-xs text-base-content/60">Last Used: {currentEmailDetail.lastUsed}</div>
    <div class="pt-3 border-t border-base-200">
      <div class="text-xs text-base-content/50 mb-2">Messages</div>
      {#if loading}
        <div class="text-center py-4 text-sm text-base-content/50">Loading...</div>
      {:else if emails.length === 0}
        <div class="text-center py-4 text-sm text-base-content/50">No messages yet</div>
      {:else}
        {#each emails as mail}
          <button class="w-full text-left py-2 border-b border-base-200 hover:bg-base-200 rounded bg-transparent border-0 px-1" onclick={() => onOpenMessageDetail(mail)}>
            <div class="flex justify-between text-xs text-base-content/60">
              <span class="font-medium">{mail.from}</span>
              <span>{mail.time}</span>
            </div>
            <div class="text-sm font-semibold mt-0.5">{mail.subject}</div>
            {#if mail.isOtp}
              <span class="badge badge-xs badge-info mt-1">OTP: {mail.otp}</span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}
