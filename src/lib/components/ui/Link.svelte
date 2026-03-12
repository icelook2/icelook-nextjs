<script lang="ts">
	import { cx } from '$lib/cva';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		children: Snippet;
	}

	let { class: className, children, ...rest }: Props = $props();
</script>

<a
	class={cx('text-accent-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 dark:text-accent-500 dark:focus-visible:outline-accent-500', className)}
	{...rest}
>
	{@render children()}
</a>
