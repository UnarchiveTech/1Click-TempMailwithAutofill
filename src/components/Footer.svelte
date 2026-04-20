<script lang="ts">
  import IconMail from './icons/IconMail.svelte';
  import IconArchive from './icons/IconArchive.svelte';
  import IconUser from './icons/IconUser.svelte';
  import IconBarChart from './icons/IconBarChart.svelte';
  import IconSettings from './icons/IconSettings.svelte';
  import IconInfo from './icons/IconInfo.svelte';

  let { currentView = 'main', onNavigate = () => {} } = $props<{
    currentView?: string;
    onNavigate?: (view: any) => void;
  }>();

  type View = 'main' | 'mailSettings' | 'settings' | 'analytics' | 'loginInfo' | 'archivedEmails' | 'emailDetail' | 'messageDetail' | 'about';

  const navItems: { view: View; label: string; icon: any }[] = [
    { view: 'main',        label: 'Inbox',    icon: IconMail },
    { view: 'mailSettings',label: 'Manage',   icon: IconArchive },
    { view: 'loginInfo',   label: 'Saved',    icon: IconUser },
    { view: 'analytics',   label: 'Stats',    icon: IconBarChart },
    { view: 'settings',    label: 'Settings', icon: IconSettings },
    { view: 'about',       label: 'About',    icon: IconInfo },
  ];
</script>

<!-- Floating Island Nav -->
<div class="flex justify-center w-full py-2">
  <nav
    class="flex items-center justify-around gap-0 px-1.5 py-1.5 rounded-full backdrop-blur-2xl bg-base-100/80 border border-base-200/60"
    style="width: 96%; box-shadow: 0 12px 40px rgba(48,41,80,0.13);"
    aria-label="Main navigation"
  >
    {#each navItems as item}
      {@const isActive = currentView === item.view}
      <button
        class="relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 {isActive ? 'bg-primary/10' : 'hover:bg-base-200/70'}"
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        onclick={() => onNavigate(item.view)}
      >
        <item.icon class="w-4 h-4 transition-colors duration-200 {isActive ? 'text-primary' : 'text-base-content/50'}" />
        <span class="text-[10px] font-semibold leading-none transition-colors duration-200 {isActive ? 'text-primary' : 'text-base-content/50'}">
          {item.label}
        </span>
        {#if isActive}
          <span class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>
        {/if}
      </button>
    {/each}
  </nav>
</div>
