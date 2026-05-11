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
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
</svg>
