<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		id?: string;
		error?: string;
		children: Snippet;
	}

	let { label, id, error, children }: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
		{label}
	</label>
	{@render children()}
	{#if error}
		<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>
