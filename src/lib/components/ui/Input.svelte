<script lang="ts">
	import { cva, cx } from '$lib/cva';
	import type { HTMLInputAttributes } from 'svelte/elements';

	const input = cva({
		base: 'w-full rounded-lg border-2 border-neutral-300 bg-transparent px-4 py-2.5 text-sm transition-all placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 focus-visible:border-accent-600 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-600 dark:placeholder:text-neutral-500 dark:focus-visible:outline-accent-500 dark:focus-visible:border-accent-500'
	});

	interface Props extends HTMLInputAttributes {
		class?: string;
		value?: string;
	}

	let { class: className, value = $bindable(''), ...rest }: Props = $props();
</script>

<input class={cx(input(), className)} bind:value {...rest} />
