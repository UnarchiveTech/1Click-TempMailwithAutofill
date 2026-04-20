<script lang="ts">
  let { onCreateInbox }: { onCreateInbox: (provider: string) => void } = $props();

  let selectedProvider = $state<'guerrilla' | 'burner'>('guerrilla');
  let step = $state<1 | 2>(1);
</script>

{#if step === 1}
  <!-- Welcome Step -->
  <div class="flex flex-col items-center justify-center h-full px-6 py-8 text-center gap-5">
    <!-- Icon -->
    <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
      </svg>
    </div>

    <div>
      <h2 class="text-xl font-bold text-base-content mb-1">Welcome to 1Click Temp Mail</h2>
      <p class="text-sm text-base-content/60">Create instant disposable email addresses to protect your privacy. No sign-up required.</p>
    </div>

    <!-- Feature highlights -->
    <div class="w-full flex flex-col gap-2.5">
      <div class="flex items-center gap-3 bg-base-200 rounded-xl px-4 py-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="text-left">
          <p class="text-xs font-semibold text-base-content">Instant Temp Address</p>
          <p class="text-xs text-base-content/50">Generate a disposable email in one click</p>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-base-200 rounded-xl px-4 py-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
          </svg>
        </div>
        <div class="text-left">
          <p class="text-xs font-semibold text-base-content">OTP Detection</p>
          <p class="text-xs text-base-content/50">Auto-detects and copies OTP codes</p>
        </div>
      </div>

      <div class="flex items-center gap-3 bg-base-200 rounded-xl px-4 py-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
          </svg>
        </div>
        <div class="text-left">
          <p class="text-xs font-semibold text-base-content">Privacy First</p>
          <p class="text-xs text-base-content/50">All data stored locally in your browser</p>
        </div>
      </div>
    </div>

    <button
      class="btn btn-primary w-full rounded-xl font-semibold"
      onclick={() => step = 2}
    >
      Get Started
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
      </svg>
    </button>
  </div>

{:else}
  <!-- Create First Inbox Step -->
  <div class="flex flex-col items-center justify-center h-full px-6 py-8 text-center gap-5">
    <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
    </div>

    <div>
      <h2 class="text-lg font-bold text-base-content mb-1">Choose a Mail Provider</h2>
      <p class="text-sm text-base-content/60">Select a provider to create your first temporary email address.</p>
    </div>

    <!-- Provider selection -->
    <div class="w-full flex flex-col gap-3">
      <button
        class="flex items-center gap-4 w-full rounded-xl px-4 py-3 border-2 transition-all {selectedProvider === 'guerrilla' ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200 hover:border-base-content/20'}"
        onclick={() => selectedProvider = 'guerrilla'}
      >
        <div class="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
          </svg>
        </div>
        <div class="text-left flex-1">
          <p class="text-sm font-semibold text-base-content">Guerrilla Mail</p>
          <p class="text-xs text-base-content/50">Auto-renewing · Editable address</p>
        </div>
        {#if selectedProvider === 'guerrilla'}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {/if}
      </button>

      <button
        class="flex items-center gap-4 w-full rounded-xl px-4 py-3 border-2 transition-all {selectedProvider === 'burner' ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200 hover:border-base-content/20'}"
        onclick={() => selectedProvider = 'burner'}
      >
        <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>
          </svg>
        </div>
        <div class="text-left flex-1">
          <p class="text-sm font-semibold text-base-content">Burner.kiwi</p>
          <p class="text-xs text-base-content/50">24-hour expiry · Multiple instances</p>
        </div>
        {#if selectedProvider === 'burner'}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {/if}
      </button>
    </div>

    <div class="w-full flex flex-col gap-2">
      <button
        class="btn btn-primary w-full rounded-xl font-semibold"
        onclick={() => onCreateInbox(selectedProvider)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
        </svg>
        Create My First Address
      </button>
      <button class="btn btn-ghost btn-sm rounded-xl text-base-content/50" onclick={() => step = 1}>
        Back
      </button>
    </div>
  </div>
{/if}
