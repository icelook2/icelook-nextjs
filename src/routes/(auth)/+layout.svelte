<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col items-center justify-center">
  {@render children()}
</div>
