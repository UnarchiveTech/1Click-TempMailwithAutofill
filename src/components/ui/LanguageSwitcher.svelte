<script lang="ts">
import { onMount } from 'svelte';
import { isRTL, locale, setLanguage } from '@/lib/i18n';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

let isOpen = $state(false);
let currentLanguage = $state('en');

onMount(() => {
  // Subscribe to locale changes
  const unsubscribe = locale.subscribe((value) => {
    currentLanguage = value || 'en';
  });

  // Load saved language from storage
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang && languages.some((lang) => lang.code === savedLang)) {
    setLanguage(savedLang);
  }

  return unsubscribe;
});

async function handleLanguageChange(langCode: string) {
  await setLanguage(langCode);
  localStorage.setItem('preferredLanguage', langCode);

  // Update document direction for RTL languages
  if (isRTL(langCode)) {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = langCode;
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = langCode;
  }

  isOpen = false;
}

function toggleDropdown() {
  isOpen = !isOpen;
}
</script>

<div class="relative">
  <button
    class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-md-surface-variant transition-colors"
    onclick={toggleDropdown}
    aria-label="Change language"
  >
    <span class="text-lg">{languages.find(lang => lang.code === currentLanguage)?.flag}</span>
    <span class="text-sm font-medium">{languages.find(lang => lang.code === currentLanguage)?.name}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 {isOpen ? 'rotate-180' : ''} transition-transform"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div class="absolute top-full right-0 mt-2 w-48 bg-md-surface rounded-xl shadow-lg border border-md-outline-variant z-50 overflow-hidden">
      {#each languages as lang}
        <button
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-md-surface-variant transition-colors text-left {currentLanguage === lang.code ? 'bg-md-surface-variant' : ''}"
          onclick={() => handleLanguageChange(lang.code)}
          aria-label="Switch to {lang.name}"
          aria-current={currentLanguage === lang.code ? 'true' : undefined}
        >
          <span class="text-lg">{lang.flag}</span>
          <span class="text-sm font-medium">{lang.name}</span>
          {#if currentLanguage === lang.code}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 text-md-primary ml-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
