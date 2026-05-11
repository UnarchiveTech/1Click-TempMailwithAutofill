<script lang="ts">
interface Props {
  class?: string;
}
let { class: className = '' }: Props = $props();
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  class={className} 
  fill="none" 
  viewBox="0 0 24 24" 
  stroke="currentColor" 
  stroke-width="2"
>
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
</svg>
