<script lang="ts">
let { class: cls = '' } = $props<{ class?: string }>();
</script>
<svg xmlns="http://www.w3.org/2000/svg" class={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <rect x="3" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/>
  <path d="M21 14v6a2 2 0 0 1-2 2h-6"/>
</svg>
