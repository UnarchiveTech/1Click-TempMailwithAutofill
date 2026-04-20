<script lang="ts">
  let { themeMode = 'system', onThemeChange = () => {} } = $props<{
    themeMode?: 'light' | 'auto' | 'dark';
    onThemeChange?: (mode: 'light' | 'auto' | 'dark') => void;
  }>();
</script>

<div class="flex items-center gap-1 bg-base-900/90 backdrop-blur-xl rounded-2xl p-1 shadow-lg shadow-indigo-500/10 border border-base-800/50">
  <!-- Light Mode -->
  <button
    class="btn btn-ghost btn-square btn-sm rounded-xl transition-all duration-300 ease-out {themeMode === 'light' ? 'bg-primary text-primary-content shadow-lg shadow-indigo-500/20' : 'text-base-content/60 hover:text-base-content hover:bg-base-800/50'} active:scale-95"
    aria-label="Light mode"
    onclick={() => onThemeChange('light')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
    </svg>
  </button>

  <!-- Auto/System Mode -->
  <button
    class="btn btn-ghost btn-square btn-sm rounded-xl transition-all duration-300 ease-out {themeMode === 'auto' ? 'bg-primary text-primary-content shadow-lg shadow-indigo-500/20' : 'text-base-content/60 hover:text-base-content hover:bg-base-800/50'} active:scale-95"
    aria-label="System mode"
    onclick={() => onThemeChange('auto')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
    </svg>
  </button>

  <!-- Dark Mode -->
  <button
    class="btn btn-ghost btn-square btn-sm rounded-xl transition-all duration-300 ease-out {themeMode === 'dark' ? 'bg-primary text-primary-content shadow-lg shadow-indigo-500/20' : 'text-base-content/60 hover:text-base-content hover:bg-base-800/50'} active:scale-95"
    aria-label="Dark mode"
    onclick={() => onThemeChange('dark')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z"/>
    </svg>
  </button>
</div>
