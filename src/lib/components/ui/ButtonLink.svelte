<script lang="ts">
	import { cva, cx } from '$lib/cva';
	import type { VariantProps } from 'cva';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	const buttonLink = cva({
		base: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]',
		variants: {
			variant: {
				primary:
					'bg-accent-600 text-white hover:bg-accent-700 focus-visible:outline-accent-600 dark:bg-accent-500 dark:hover:bg-accent-400 dark:focus-visible:outline-accent-500'
			}
		},
		defaultVariants: {
			variant: 'primary'
		}
	});

	type ButtonLinkVariants = VariantProps<typeof buttonLink>;

	interface Props extends HTMLAnchorAttributes {
		variant?: ButtonLinkVariants['variant'];
		active?: boolean;
		children: Snippet;
	}

	let { variant = 'primary', active = false, class: className, children, ...rest }: Props = $props();
</script>

<a
	class={cx(buttonLink({ variant }), active && 'ring-2 ring-accent-600 dark:ring-accent-500', className)}
	aria-current={active ? 'page' : undefined}
	{...rest}
>
	{@render children()}
</a>
