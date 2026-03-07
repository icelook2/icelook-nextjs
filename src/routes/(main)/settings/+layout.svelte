<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	{@render children()}
</div>
