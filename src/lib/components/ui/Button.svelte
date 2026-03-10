<script lang="ts">
	import { cva, cx } from '$lib/cva';
	import type { VariantProps } from 'cva';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	const button = cva({
		base: 'inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary:
					'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:outline-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:outline-neutral-100'
			}
		},
		defaultVariants: {
			variant: 'primary'
		}
	});

	type ButtonVariants = VariantProps<typeof button>;

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariants['variant'];
		loading?: boolean;
		children: Snippet;
	}

	let { variant = 'primary', loading = false, disabled, class: className, children, ...rest }: Props = $props();
</script>

<button
	class={cx(button({ variant }), className)}
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<span class="icon-[lucide--loader-2] animate-spin size-4"></span>
	{/if}
	{@render children()}
</button>
