<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'ghost' | 'outline';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		children?: Snippet;
	}

	let {
		variant = 'ghost',
		size = 'md',
		type = 'button',
		class: className,
		children,
		...rest
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-neutral-50 disabled:pointer-events-none disabled:opacity-50';

	const variantClasses: Record<Variant, string> = {
		ghost: 'text-neutral-900 hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800',
		outline:
			'border border-neutral-300 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-800'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'h-8 w-8',
		md: 'h-10 w-10',
		lg: 'h-12 w-12'
	};
</script>

<button {type} class={[baseClasses, variantClasses[variant], sizeClasses[size], className]} {...rest}>
	{@render children?.()}
</button>
