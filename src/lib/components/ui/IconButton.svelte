<script lang="ts">
	import { cva, cx } from '$lib/cva';
	import type { VariantProps } from 'cva';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	const iconButton = cva({
		base: 'inline-flex items-center justify-center rounded-full p-4 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				ghost:
					'hover:bg-neutral-100 focus-visible:outline-neutral-900 dark:hover:bg-neutral-800 dark:focus-visible:outline-neutral-100'
			}
		},
		defaultVariants: {
			variant: 'ghost'
		}
	});

	type IconButtonVariants = VariantProps<typeof iconButton>;

	interface Props extends HTMLButtonAttributes {
		variant?: IconButtonVariants['variant'];
		children: Snippet;
	}

	let { variant = 'ghost', class: className, children, ...rest }: Props = $props();
</script>

<button
	class={cx(iconButton({ variant }), className)}
	{...rest}
>
	{@render children()}
</button>
