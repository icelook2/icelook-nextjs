<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center">
	{@render children()}
</div>
