<script lang="ts">
	import { cx } from '$lib/cva';
	import type { Snippet } from 'svelte';

	interface Props {
		label?: string;
		error?: string;
		class?: string;
		children: Snippet;
	}

	let { label, error, class: className, children }: Props = $props();
</script>

<div class={cx('space-y-0', className)}>
	{#if label}
		<label class="block">
			<span class="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
			{@render children()}
		</label>
	{:else}
		{@render children()}
	{/if}
	{#if error}
		<p class="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
	{/if}
</div>
