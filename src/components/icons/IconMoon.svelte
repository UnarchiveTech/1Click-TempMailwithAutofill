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
  <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z"/>
</svg>
