<script lang="ts">
	import { cva, cx } from '$lib/cva';
	import type { VariantProps } from 'cva';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	const iconButtonLink = cva({
		base: 'inline-flex items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] p-4',
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

	type IconButtonLinkVariants = VariantProps<typeof iconButtonLink>;

	interface Props extends HTMLAnchorAttributes {
		variant?: IconButtonLinkVariants['variant'];
		active?: boolean;
		children: Snippet;
	}

	let { variant = 'ghost', active = false, class: className, children, ...rest }: Props = $props();
</script>

<a
	class={cx(iconButtonLink({ variant }), active && 'bg-neutral-100 dark:bg-neutral-800', className)}
	aria-current={active ? 'page' : undefined}
	{...rest}
>
	{@render children()}
</a>
