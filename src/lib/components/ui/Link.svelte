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
	class={cx('text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-100 dark:focus-visible:outline-neutral-100', className)}
	{...rest}
>
	{@render children()}
</a>
