<script lang="ts">
	import { cx } from '$lib/cva';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLElement> {
		leading?: Snippet;
		children?: Snippet;
		trailing?: Snippet;
	}

	let { leading, children, trailing, class: className, ...rest }: Props = $props();
</script>

<header class={cx('flex items-center gap-3 py-4', className)} {...rest}>
	{#if leading}
		<div class="shrink-0">{@render leading()}</div>
	{/if}

	{#if children}
		<div class="min-w-0 flex-1">{@render children()}</div>
	{/if}

	{#if trailing}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</header>
