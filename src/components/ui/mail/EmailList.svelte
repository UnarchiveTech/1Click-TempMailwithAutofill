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
  highlightedEmailId = '',
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
  highlightedEmailId?: string;
}>();

// Pull-to-refresh state
let pullToRefresh = $state(false);
let pullDistance = $state(0);
let startY = $state(0);
let isPulling = $state(false);

// Extract domain from email address
function getDomainFromEmail(email: string): string {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : '';
}

// Get root domain (strips subdomains)
function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : domain;
}

// Get favicon URL for a domain
function getFaviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://${domain}/favicon.ico`;
}

// Extract display name from email address
function getDisplayName(email: string, name?: string): string {
  if (name) return name;
  if (!email) return 'Unknown';
  const localPart = email.split('@')[0];
  // Convert john.doe or john_doe to "John Doe"
  return localPart.replace(/[._]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
</script>

<div
  class="flex-1 px-1 border-t border-base-200 overflow-y-auto relative"
  style="max-height: 300px; padding-bottom: 120px; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent;"
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
        class="w-full text-left border-0 bg-transparent focus:outline-none hover:bg-base-200/40 transition-colors duration-150 {mail.id === highlightedEmailId ? 'bg-primary/5' : ''}"
        onclick={() => onOpenMessageDetail(mail)}
        onkeydown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement)?.focus(); }
        }}
        aria-label={`Email from ${mail.from}: ${mail.subject}`}
        tabindex="0"
      >
        <div class="flex items-center gap-2 px-0 py-00.5 border-b border-base-200/50">

          <!-- Indigo unread dot -->
          <div class="flex-shrink-0 w-2 flex items-center justify-center">
            {#if mail.unread}
              <span class="w-2 h-2 rounded-full bg-primary"></span>
            {:else}
              <span class="w-2 h-2"></span>
            {/if}
          </div>

          <!-- Dark rounded square avatar (40px, dark bg, large favicon) -->
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-base-content overflow-hidden flex items-center justify-center">
            {#if mail.from}
              <img
                src={`https://www.google.com/s2/favicons?sz=32&domain=${getRootDomain(getDomainFromEmail(mail.from))}`}
                alt=""
                class="object-cover"
                loading="lazy"
                onerror={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const letter = (mail.from_name || mail.from || '?')[0].toUpperCase();
                  if (img.parentElement) {
                    img.parentElement.innerHTML = `<span class="text-base-100 text-lg font-bold">${letter}</span>`;
                  }
                }}
              />
            {:else}
              <span class="text-base-100 text-lg font-bold">?</span>
            {/if}
          </div>

          <!-- Text -->
          <div class="flex flex-col flex-1 min-w-0">
            <div class="flex items-baseline justify-between gap-2 mb-0.5">
              <span class="text-sm font-bold text-base-content truncate leading-tight">{getDisplayName(mail.from || '', mail.from_name)}</span>
              <span class="text-[10px] font-medium text-base-content/40 flex-shrink-0">{mail.time}</span>
            </div>
            <div class="flex items-center gap-2">
              <p class="text-xs text-base-content/50 truncate leading-tight flex-1">{mail.subject || '(no subject)'}</p>
              {#if mail.isOtp}
                <span
                  class="badge badge-xs badge-info cursor-pointer hover:badge-info/80 transition-colors flex-shrink-0"
                  role="button"
                  tabindex="0"
                  onclick={(e) => { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); }}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onCopyOtpFromMessage(mail.otp); } }}
                  aria-label={`Copy OTP code ${mail.otp}`}
                >OTP: {mail.otp}</span>
              {/if}
            </div>
          </div>

        </div>
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
