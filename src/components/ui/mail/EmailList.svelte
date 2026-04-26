<script lang="ts">
import IconMail from '@/components/icons/IconMail.svelte';
import type { Email } from '@/utils/types.js';

let {
  displayedEmails = [],
  filteredEmails = [],
  displayedEmailCount = 0,
  loading = false,
  searchQuery = '',
  otpOnly = false,
  onOpenMessageDetail = () => {},
  onClearFilters = () => {},
  onRefreshInbox = () => {},
  onCopyOtpFromMessage = () => {},
  loadMoreEmails = () => {},
} = $props<{
  displayedEmails?: Email[];
  filteredEmails?: Email[];
  displayedEmailCount?: number;
  loading?: boolean;
  searchQuery?: string;
  otpOnly?: boolean;
  onOpenMessageDetail?: (email: Email) => void;
  onClearFilters?: () => void;
  onRefreshInbox?: () => Promise<void>;
  onCopyOtpFromMessage?: (otp: string) => void;
  loadMoreEmails?: () => void;
}>();

// Pull-to-refresh state
let pullToRefresh = $state(false);
let pullDistance = $state(0);
let startY = $state(0);
let isPulling = $state(false);
</script>

<div
  class="flex-1 px-3 border-t border-base-200 overflow-y-auto relative"
  role="region"
  aria-label="Email list"
  ontouchstart={(e) => {
    const container = e.currentTarget as HTMLElement;
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }}
  ontouchmove={(e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    pullDistance = Math.min(currentY - startY, 80);
    if (pullDistance > 20) pullToRefresh = true;
  }}
  ontouchend={async () => {
    if (pullToRefresh && pullDistance > 50) {
      await onRefreshInbox();
    }
    pullToRefresh = false;
    pullDistance = 0;
    isPulling = false;
    startY = 0;
  }}
  onscroll={(e) => {
    const container = e.currentTarget as HTMLElement;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (scrollBottom < 100 && displayedEmailCount < filteredEmails.length) {
      loadMoreEmails();
    }
  }}
>
  {#if pullDistance > 0}
    <div class="flex items-center justify-center py-2" style="opacity: {pullDistance / 80}">
      {#if pullToRefresh}
        <span class="loading loading-spinner loading-sm text-primary"></span>
      {/if}
      <span class="text-xs text-base-content/50 ml-2">{pullToRefresh ? 'Release to refresh' : 'Pull to refresh'}</span>
    </div>
  {/if}
  {#if loading}
    <div class="py-2 space-y-2">
      {#each [1, 2, 3] as _}
        <div class="py-2 border-b border-base-200 px-1">
          <div class="flex justify-between mb-1">
            <div class="h-3 w-24 bg-base-200 rounded-lg animate-pulse"></div>
            <div class="h-3 w-12 bg-base-200 rounded-lg animate-pulse"></div>
          </div>
          <div class="h-4 w-3/4 bg-base-200 rounded-lg animate-pulse"></div>
        </div>
      {/each}
    </div>
  {:else if displayedEmails.length === 0}
    <div class="flex flex-col items-center justify-center pt-8 pb-4 px-4">
      <div class="w-16 h-16 rounded-lg-full bg-base-200 flex items-center justify-center mb-4">
        <IconMail class="w-8 h-8 text-base-content/40" />
      </div>
      <h3 class="text-base font-medium text-base-content mb-2">No emails found</h3>
      {#if searchQuery || otpOnly}
        <p class="text-xs text-base-content/50 mb-4 text-center max-w-xs">
          Try adjusting your filters or search terms
        </p>
        <button class="btn btn-sm btn-primary" onclick={onClearFilters}>
          Clear Filters
        </button>
      {:else}
        <p class="text-xs text-base-content/50 mb-4 text-center max-w-xs">
          Your inbox is empty. Emails will appear here when they arrive.
        </p>
        <button class="btn btn-sm btn-primary" onclick={onRefreshInbox} disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          Refresh Inbox
        </button>
      {/if}
    </div>
  {:else}
    {#each displayedEmails as mail, index}
      <button 
        class="w-full text-left py-2.5 border-b border-base-200 hover:bg-base-200 px-2 rounded-lg bg-transparent border-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20" 
        onclick={() => onOpenMessageDetail(mail)}
        onkeydown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = e.currentTarget.nextElementSibling as HTMLElement;
            next?.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = e.currentTarget.previousElementSibling as HTMLElement;
            prev?.focus();
          }
        }}
        aria-label={`Email from ${mail.from}: ${mail.subject}`}
        tabindex="0"
      >
        <div class="flex justify-between text-xs text-base-content/60 mb-1">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="font-medium truncate">{mail.from}</span>
            {#if mail.unread}
              <span class="badge badge-xs badge-primary">New</span>
            {/if}
          </div>
          <span class="flex-shrink-0">{mail.time}</span>
        </div>
        <div class="text-sm font-medium text-base-content truncate mb-0.5">{mail.subject}</div>
        <div class="text-xs text-base-content/50 truncate">{mail.snippet}</div>
        {#if mail.isOtp}
          <span 
            class="badge badge-xs badge-info mt-1.5 cursor-pointer hover:badge-info/80 transition-colors" 
            role="button" 
            tabindex="0"
            onclick={(e) => { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); }}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); } }}
            aria-label={`Copy OTP code ${mail.otp}`}
          >
            OTP: {mail.otp}
          </span>
        {/if}
      </button>
    {/each}
    {#if displayedEmailCount < filteredEmails.length}
      <div class="text-center py-2 text-xs text-base-content/50">
        <span class="loading loading-spinner loading-xs"></span>
        Loading more emails...
      </div>
    {/if}
  {/if}
</div>
