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
  <polyline points="18 15 12 9 6 15"/>
</svg>
