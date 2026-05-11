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
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
</svg>
