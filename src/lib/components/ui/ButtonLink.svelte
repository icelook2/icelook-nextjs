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
					'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:outline-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:outline-neutral-100'
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
	class={cx(buttonLink({ variant }), active && 'ring-2 ring-neutral-900 dark:ring-neutral-100', className)}
	aria-current={active ? 'page' : undefined}
	{...rest}
>
	{@render children()}
</a>
