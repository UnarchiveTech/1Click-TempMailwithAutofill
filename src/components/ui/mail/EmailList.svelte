<script lang="ts">
import { browser } from 'wxt/browser';
import IconCopy from '@/components/icons/IconCopy.svelte';
import IconMail from '@/components/icons/IconMail.svelte';
import IconTrash from '@/components/icons/IconTrash.svelte';
import EmptyState from '@/components/ui/EmptyState.svelte';
import Skeleton from '@/components/ui/Skeleton.svelte';
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

// Long-press context menu state
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressEmail = $state<Email | null>(null);
let contextMenuOpen = $state(false);
let contextMenuPosition = $state({ x: 0, y: 0 });

function handleLongPressStart(email: Email, e: TouchEvent | MouseEvent) {
  if (longPressTimer) clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    longPressEmail = email;
    contextMenuOpen = true;
    const touch = 'touches' in e ? e.touches[0] : e;
    contextMenuPosition = { x: touch.clientX, y: touch.clientY };
  }, 500);
}

function handleLongPressEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function closeContextMenu() {
  contextMenuOpen = false;
  longPressEmail = null;
}

// Track successful image loads and domain attempts for each email
let imageLoaded = $state<Record<string, boolean>>({});
let faviconDomainAttempt = $state<
  Record<string, 'full' | 'stripped' | 'root' | 'google' | 'failed'>
>({});
let googleFaviconBlobUrl = $state<Record<string, string>>({});

// Derived state for each email to ensure reactivity
let faviconUrls = $derived<Record<string, string>>({});
$effect(() => {
  const urls: Record<string, string> = {};
  for (const mail of displayedEmails) {
    if (!mail.from) continue;
    const fullDomain = getDomainFromEmail(mail.from);
    const strippedDomain = getStrippedDomain(fullDomain);
    const rootDomain = getRootDomain(fullDomain);
    const attempt = faviconDomainAttempt[mail.id] || 'full';
    let currentDomain = fullDomain;
    if (attempt === 'stripped') currentDomain = strippedDomain;
    else if (attempt === 'root') currentDomain = rootDomain;
    urls[mail.id] = googleFaviconBlobUrl[mail.id] || `https://${currentDomain}/favicon.ico`;
  }
  faviconUrls = urls;
});

// Google's default favicon hash (SHA-256 of default placeholder)
const GOOGLE_DEFAULT_HASH = '59bfe9bc385ad69f50793ce4a53397316d7a875a7148a63c16df9b674c6cda64';

// Fetch favicon via background script (bypasses CORS), returns base64 data URL or null
async function fetchFaviconViaBackground(
  url: string
): Promise<{ dataUrl: string; hash: string } | null> {
  try {
    const response = (await browser.runtime.sendMessage({ type: 'fetchFavicon', url })) as {
      success: boolean;
      base64?: string;
      contentType?: string;
      hash?: string;
      error?: string;
    };
    console.log('fetchFaviconViaBackground response:', response);
    if (!response.success || !response.base64 || !response.hash) {
      console.log('fetchFaviconViaBackground failed:', response);
      return null;
    }
    const dataUrl = `data:${response.contentType};base64,${response.base64}`;
    console.log('fetchFaviconViaBackground success:', {
      dataUrl: `${dataUrl.substring(0, 50)}...`,
      hash: response.hash,
    });
    return { dataUrl, hash: response.hash };
  } catch (e) {
    console.error('fetchFaviconViaBackground error:', e);
    return null;
  }
}

// Favicon cache for successful loads only (24-hour expiration)
const FAVICON_CACHE_KEY = 'favicon_success_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getFaviconCache(): Record<string, { timestamp: number }> {
  try {
    const cached = localStorage.getItem(FAVICON_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return {};
}

function setFaviconCacheSuccess(domain: string) {
  const cache = getFaviconCache();
  cache[domain] = { timestamp: Date.now() };
  try {
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function isFaviconCachedSuccess(domain: string): boolean {
  const cache = getFaviconCache();
  const entry = cache[domain];
  if (!entry) return false;
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    delete cache[domain];
    try {
      localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
    } catch {}
    return false;
  }
  return true;
}

// Extract domain from email address
function getDomainFromEmail(email: string): string {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : '';
}

// Get root domain (strips subdomains, handles multi-level TLDs like .co.uk)
function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  // Common multi-level TLDs
  const multiLevelTLDs = [
    'co.uk',
    'com.au',
    'co.nz',
    'co.za',
    'ac.uk',
    'gov.uk',
    'org.uk',
    'net.uk',
    'nhs.uk',
    'police.uk',
    'mod.uk',
    'sch.uk',
  ];
  const tld = parts.slice(-2).join('.');

  if (multiLevelTLDs.includes(tld)) {
    // For multi-level TLDs, if more than 3 parts, take last 3
    // If exactly 3 parts, check if first part is a subdomain (contains dash or is common subdomain)
    if (parts.length > 3) {
      return parts.slice(-3).join('.');
    } else if (parts.length === 3) {
      // For domains like "email-staples.co.uk", the root is "staples.co.uk"
      // For domains like "staples.co.uk", the root is "staples.co.uk"
      // We need to detect if the first part is a subdomain
      const firstPart = parts[0];
      const commonSubdomains = [
        'www',
        'mail',
        'email',
        'web',
        'm',
        'mobile',
        'app',
        'api',
        'blog',
        'shop',
        'store',
      ];
      if (commonSubdomains.includes(firstPart) || firstPart.includes('-')) {
        // It's a subdomain, take last 2 parts
        return parts.slice(-2).join('.');
      }
      // Not a subdomain, return as is
      return domain;
    }
  }

  // Standard TLDs: take last 2 parts
  return parts.length > 2 ? parts.slice(-2).join('.') : domain;
}

// Strip dash and preceding word from domain (e.g., email-staples.co.uk -> staples.co.uk)
function getStrippedDomain(domain: string): string {
  const dashIndex = domain.indexOf('-');
  if (dashIndex === -1) return domain;
  return domain.substring(dashIndex + 1);
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

const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-emerald-700',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-orange-600',
  'bg-cyan-700',
  'bg-rose-600',
];

function avatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
</script>

<div
  class="flex-1 px-1 border-t border-md-secondary-container {displayedEmails.length > 0 ? 'overflow-y-auto' : ''} relative"
  style="max-height: 300px; padding-bottom: 120px; scrollbar-width: thin; scrollbar-color: var(--md-primary) transparent;"
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
        <span class="loading loading-spinner loading-sm text-md-primary"></span>
      {/if}
      <span class="text-xs text-md-on-surface/50 ml-2">{pullToRefresh ? 'Release to refresh' : 'Pull to refresh'}</span>
    </div>
  {/if}
  {#if loading}
    <div class="py-2 space-y-2">
      {#each [1, 2, 3] as _}
        <div class="py-2 border-b border-md-secondary-container px-1">
          <div class="flex justify-between mb-1">
            <Skeleton width="6rem" height="0.75rem" />
            <Skeleton width="3rem" height="0.75rem" />
          </div>
          <Skeleton width="75%" height="1rem" />
        </div>
      {/each}
    </div>
  {:else if displayedEmails.length === 0}
    <EmptyState
      icon="<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 text-md-on-surface/40' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'/></svg>"
      title="No emails found"
      description={searchQuery || otpOnly ? "Try adjusting your filters or search terms" : "Your inbox is empty. Emails will appear here when they arrive."}
      actionLabel={searchQuery || otpOnly ? "Clear Filters" : "Refresh Inbox"}
      onAction={searchQuery || otpOnly ? onClearFilters : () => onRefreshInbox()}
    />
  {:else}
    {#each displayedEmails as mail, index}
      <button
        class="w-full text-left border-0 bg-transparent focus:outline-none hover:bg-md-surface-variant/40 transition-colors duration-150 {mail.id === highlightedEmailId ? 'bg-md-primary/5' : ''}"
        onclick={() => onOpenMessageDetail(mail)}
        ontouchstart={(e) => handleLongPressStart(mail, e)}
        ontouchend={handleLongPressEnd}
        ontouchmove={handleLongPressEnd}
        onmousedown={(e) => handleLongPressStart(mail, e)}
        onmouseup={handleLongPressEnd}
        onmouseleave={handleLongPressEnd}
        oncontextmenu={(e) => { e.preventDefault(); }}
        onkeydown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement)?.focus(); }
        }}
        aria-label={`Email from ${mail.from}: ${mail.subject}`}
        tabindex="0"
      >
        <div class="flex items-center gap-2 px-0 py-00.5 border-b border-md-outline-variant/50">

          <!-- Indigo unread dot -->
          <div class="flex-shrink-0 w-2 flex items-center justify-center">
            {#if mail.unread}
              <span class="w-2 h-2 rounded-full bg-md-primary"></span>
            {:else}
              <span class="w-2 h-2"></span>
            {/if}
          </div>

          <!-- Avatar: letter shown until favicon loads, then replaced -->
          {#if mail.from}
            {@const fullDomain = getDomainFromEmail(mail.from)}
            {@const strippedDomain = getStrippedDomain(fullDomain)}
            {@const rootDomain = getRootDomain(fullDomain)}
            {@const googleUrl = `https://www.google.com/s2/favicons?sz=32&domain=${strippedDomain}`}
            {@const attempt = faviconDomainAttempt[mail.id] || 'full'}
            {@const isFailed = attempt === 'failed'}
            {@const isLoaded = imageLoaded[mail.id] === true || isFaviconCachedSuccess(rootDomain)}
            <div class="flex-shrink-0 w-10 h-10 rounded-lg {isLoaded ? 'bg-md-surface-container-low' : avatarColor(mail.from)} overflow-hidden flex items-center justify-center relative">
              {#if attempt === 'full'}
                <img
                  src={`https://${fullDomain}/favicon.ico`}
                  alt=""
                  class="absolute inset-0 w-full h-full object-cover {isLoaded ? 'opacity-100' : 'opacity-0'}"
                  onload={() => {
                    console.log('img onload for full:', mail.id);
                    imageLoaded[mail.id] = true;
                    setFaviconCacheSuccess(rootDomain);
                  }}
                  onerror={() => {
                    console.log('img onerror for full:', mail.id);
                    faviconDomainAttempt[mail.id] = 'stripped';
                  }}
                />
              {:else if attempt === 'stripped'}
                <img
                  src={`https://${strippedDomain}/favicon.ico`}
                  alt=""
                  class="absolute inset-0 w-full h-full object-cover {isLoaded ? 'opacity-100' : 'opacity-0'}"
                  onload={() => {
                    console.log('img onload for stripped:', mail.id);
                    imageLoaded[mail.id] = true;
                    setFaviconCacheSuccess(rootDomain);
                  }}
                  onerror={() => {
                    console.log('img onerror for stripped:', mail.id);
                    faviconDomainAttempt[mail.id] = 'root';
                  }}
                />
              {:else if attempt === 'root'}
                <img
                  src={`https://${rootDomain}/favicon.ico`}
                  alt=""
                  class="absolute inset-0 w-full h-full object-cover {isLoaded ? 'opacity-100' : 'opacity-0'}"
                  onload={() => {
                    console.log('img onload for root:', mail.id);
                    imageLoaded[mail.id] = true;
                    setFaviconCacheSuccess(rootDomain);
                  }}
                  onerror={() => {
                    console.log('img onerror for root:', mail.id);
                    console.log('Fetching Google favicon for:', googleUrl);
                    fetchFaviconViaBackground(googleUrl).then(result => {
                      console.log('Google favicon result:', result);
                      if (!result || result.hash === GOOGLE_DEFAULT_HASH) {
                        console.log('Google favicon is default or failed');
                        faviconDomainAttempt[mail.id] = 'failed';
                        imageLoaded[mail.id] = false;
                      } else {
                        console.log('Google favicon is valid, setting blob URL');
                        googleFaviconBlobUrl[mail.id] = result.dataUrl;
                        faviconDomainAttempt[mail.id] = 'google';
                      }
                    });
                  }}
                />
              {:else if attempt === 'google' && googleFaviconBlobUrl[mail.id]}
                <img
                  src={googleFaviconBlobUrl[mail.id]}
                  alt=""
                  class="absolute inset-0 w-full h-full object-cover {isLoaded ? 'opacity-100' : 'opacity-0'}"
                  onload={() => {
                    console.log('img onload for google:', mail.id);
                    imageLoaded[mail.id] = true;
                    setFaviconCacheSuccess(rootDomain);
                  }}
                  onerror={() => {
                    console.log('img onerror for google:', mail.id);
                    faviconDomainAttempt[mail.id] = 'failed';
                    imageLoaded[mail.id] = false;
                  }}
                />
              {/if}
              {#if !isLoaded}
                <span class="text-white text-lg font-bold z-10">
                  {(mail.from_name || mail.from || '?')[0].toUpperCase()}
                </span>
              {/if}
            </div>
          {:else}
            <span class="text-white text-lg font-bold bg-gray-500 w-10 h-10 rounded-lg flex items-center justify-center">?</span>
          {/if}

          <!-- Text -->
          <div class="flex flex-col flex-1 min-w-0">
            <div class="flex items-baseline justify-between gap-2 mb-0.5">
              <span class="text-sm font-bold text-md-on-surface truncate leading-tight">{getDisplayName(mail.from || '', mail.from_name)}</span>
              <span class="text-[10px] font-medium text-md-on-surface/40 flex-shrink-0">{mail.time}</span>
            </div>
            <div class="flex items-center gap-2">
              <p class="text-xs text-md-on-surface/50 truncate leading-tight flex-1">{mail.subject || '(no subject)'}</p>
              {#if mail.local_only}
                <span class="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-600 flex-shrink-0">Local</span>
              {/if}
              {#if mail.isOtp}
                <span
                  class="px-2 py-0.5 text-xs rounded-full bg-md-primary/20 text-md-primary cursor-pointer hover:bg-md-primary/30 transition-colors flex-shrink-0"
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
      <div class="text-center py-2 text-xs text-md-on-surface/50">
        <span class="loading loading-spinner loading-xs"></span>
        Loading more emails...
      </div>
    {/if}
  {/if}
</div>

<!-- Context menu for long-press -->
{#if contextMenuOpen}
  <div
    class="fixed inset-0 z-50"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={closeContextMenu}
    onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu(); }}
  >
    <div
      class="absolute bg-md-surface rounded-lg shadow-2xl border border-md-outline-variant overflow-hidden"
      style="left: {Math.min(contextMenuPosition.x, window.innerWidth - 200)}px; top: {Math.min(contextMenuPosition.y, window.innerHeight - 150)}px;"
      role="menu"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu(); }}
    >
      <div class="p-1">
        <button
          class="w-full text-left px-3 py-2 text-sm text-md-on-surface hover:bg-md-surface-variant rounded-md transition-colors flex items-center gap-2"
          role="menuitem"
          onclick={() => { closeContextMenu(); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeContextMenu(); }}
        >
          <IconTrash class="w-4 h-4 text-md-error" />
          <span>Delete</span>
        </button>
        <button
          class="w-full text-left px-3 py-2 text-sm text-md-on-surface hover:bg-md-surface-variant rounded-md transition-colors flex items-center gap-2"
          role="menuitem"
          onclick={() => { closeContextMenu(); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeContextMenu(); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-md-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span>Archive</span>
        </button>
      </div>
    </div>
  </div>
{/if}
