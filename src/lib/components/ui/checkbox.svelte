<script lang="ts">
	type Size = 'sm' | 'md' | 'lg';

	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		checked?: boolean;
		size?: Size;
		disabled?: boolean;
		onclick?: MouseEventHandler<HTMLInputElement>;
		class?: string;
	}

	let { checked = $bindable(false), size = 'md', disabled = false, onclick, class: className }: Props =
		$props();

	const sizeClasses: Record<Size, string> = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};
</script>

<input
	type="checkbox"
	bind:checked
	{disabled}
	{onclick}
	class={[
		'checkbox rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:checked:bg-neutral-50 dark:focus:ring-neutral-50 disabled:pointer-events-none disabled:opacity-50',
		sizeClasses[size],
		className
	]}
/>

<style>
	:global(.dark) .checkbox:checked {
		background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='%23171717' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
	}
</style>
