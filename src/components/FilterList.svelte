<script lang="ts">
  let {
    searchQuery = '',
    sortBy = 'date',
    otpOnly = false,
    senderDomain = '',
    dateFrom = '',
    dateTo = '',
    savedSearchFilters = [],
    onSearchChange = () => {},
    onSortChange = () => {},
    onOtpOnlyChange = () => {},
    onSenderDomainChange = () => {},
    onDateFromChange = () => {},
    onDateToChange = () => {},
    onClearFilters = () => {},
    onSaveFilter = () => {},
    onLoadFilter = () => {},
    onDeleteFilter = () => {},
    onRefreshInbox = () => {},
    onToggleNotifications = () => {},
    notificationsEnabled = true
  } = $props();

  let filterOpen = $state(false);
  let saveFilterName = $state('');
  let showSaveFilter = $state(false);
</script>

<div class="flex items-center gap-1.5 px-3 pt-2 pb-2">
  <!-- Search input with search icon left + filter button inside right -->
  <div class="relative flex-1">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/>
    </svg>
    <input
      type="text"
      placeholder="Search emails..."
      class="input input-bordered input-sm w-full pl-8 pr-8 text-sm rounded-xl"
      aria-label="Search emails"
      bind:value={searchQuery}
      oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
    />
    <!-- Filter button inside search input, right side -->
    <div class="absolute right-1.5 top-1/2 -translate-y-1/2">
      <button
        class="w-6 h-6 flex items-center justify-center rounded-lg transition-colors {filterOpen ? 'text-primary' : 'text-base-content/40 hover:text-base-content/70'}"
        aria-label="Filters"
        onclick={() => filterOpen = !filterOpen}
      >
        <svg width="14" height="14" viewBox="0 0 196 183" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M30 32 H112 C116 32 118 36 115 39 L84 75 V128 C84 132 81 135 77 132 L63 122 C61 120 60 118 60 115 V75 L27 39 C24 36 26 32 30 32 Z" />
          <rect x="125" y="34" width="30" height="20" rx="10" />
          <rect x="95" y="74" width="60" height="20" rx="10" />
          <rect x="95" y="114" width="60" height="20" rx="10" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Filter dropdown anchor (positioned relative to search bar) -->
  <div class="relative w-0 h-0">

    {#if filterOpen}
      <!-- Backdrop to close -->
      <button
        class="fixed inset-0 z-10 cursor-default bg-transparent border-0"
        aria-label="Close filters"
        onclick={() => filterOpen = false}
      ></button>

      <!-- Filter dropdown panel -->
      <div class="absolute right-0 top-2 w-64 bg-base-100 border border-base-300 rounded-lg shadow-xl z-20 overflow-hidden p-3 space-y-3">
        <!-- Sort by -->
        <div>
          <label class="text-xs font-medium text-base-content/70 mb-1 block" for="sort-select">Sort by</label>
          <select id="sort-select" class="select select-bordered select-xs w-full" bind:value={sortBy} onchange={(e) => onSortChange((e.target as HTMLSelectElement).value)}>
            <option value="date">Date</option>
            <option value="sender">Sender</option>
          </select>
        </div>

        <!-- OTP only -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="checkbox checkbox-xs" aria-label="Show only OTP emails" bind:checked={otpOnly} onchange={(e) => onOtpOnlyChange((e.target as HTMLInputElement).checked)} />
          <span class="text-sm">OTP only</span>
        </label>

        <!-- Sender domain filter -->
        <div>
          <label class="text-xs font-medium text-base-content/70 mb-1 block" for="sender-domain">Sender domain</label>
          <input
            id="sender-domain"
            type="text"
            placeholder="e.g., gmail.com"
            class="input input-bordered input-xs w-full"
            aria-label="Filter by sender domain"
            bind:value={senderDomain}
            oninput={(e) => onSenderDomainChange((e.target as HTMLInputElement).value)}
          />
        </div>

        <!-- Date range filter -->
        <div class="space-y-2">
          <span class="text-xs font-medium text-base-content/70 block">Date range</span>
          <div class="flex gap-2">
            <div class="flex-1">
              <input
                type="date"
                class="input input-bordered input-xs w-full"
                aria-label="Filter emails from this date"
                placeholder="From"
                bind:value={dateFrom}
                onchange={(e) => onDateFromChange((e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="flex-1">
              <input
                type="date"
                class="input input-bordered input-xs w-full"
                aria-label="Filter emails until this date"
                placeholder="To"
                bind:value={dateTo}
                onchange={(e) => onDateToChange((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </div>

        <!-- Clear filters -->
        <button class="btn btn-xs btn-ghost w-full mt-2" aria-label="Clear all filters" onclick={() => { onClearFilters(); filterOpen = false; }}>
          Clear Filters
        </button>

        <!-- Save current filter -->
        <button class="btn btn-xs btn-outline w-full" aria-label="Save current filter" onclick={() => showSaveFilter = true}>
          Save Filter
        </button>

        {#if showSaveFilter}
          <div class="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Filter name"
              class="input input-bordered input-xs w-full"
              aria-label="Enter filter name"
              bind:value={saveFilterName}
            />
            <div class="flex gap-2">
              <button
                class="btn btn-xs btn-primary flex-1"
                aria-label="Save filter"
                onclick={() => {
                  if (saveFilterName.trim()) {
                    onSaveFilter(saveFilterName.trim());
                    saveFilterName = '';
                    showSaveFilter = false;
                  }
                }}
              >
                Save
              </button>
              <button
                class="btn btn-xs btn-ghost flex-1"
                aria-label="Cancel saving filter"
                onclick={() => { saveFilterName = ''; showSaveFilter = false; }}
              >
                Cancel
              </button>
            </div>
          </div>
        {/if}

        <!-- Saved filters -->
        {#if savedSearchFilters.length > 0}
          <div class="divider my-2"></div>
          <span class="text-xs font-medium text-base-content/70 block mb-2">Saved Filters</span>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            {#each savedSearchFilters as filter}
              <div class="flex items-center justify-between gap-2 text-xs">
                <button
                  class="flex-1 text-left hover:underline truncate"
                  onclick={() => { onLoadFilter(filter); filterOpen = false; }}
                >
                  {filter.name}
                </button>
                <button
                  class="btn btn-xs btn-ghost btn-square text-error"
                  aria-label="Delete filter"
                  onclick={() => onDeleteFilter(filter.id)}
                >
                  ×
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Refresh button -->
  <button
    class="w-8 h-8 flex items-center justify-center rounded-xl bg-base-200 hover:bg-base-300 transition-colors shrink-0"
    data-tip="Refresh"
    aria-label="Refresh inbox"
    onclick={() => onRefreshInbox()}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>
    </svg>
  </button>
  <!-- Notifications button -->
  <button
    class="w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0 {notificationsEnabled ? 'bg-warning/20 hover:bg-warning/30' : 'bg-base-200 hover:bg-base-300'}"
    data-tip="{notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}"
    aria-label="Notifications"
    onclick={() => onToggleNotifications()}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 {notificationsEnabled ? 'text-warning' : 'text-base-content/40'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/>
    </svg>
  </button>
</div>
