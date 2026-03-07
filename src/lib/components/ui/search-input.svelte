<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Search, X } from 'lucide-svelte';

	interface Props extends HTMLInputAttributes {
		value?: string;
	}

	let { class: className, value = $bindable(''), ...rest }: Props = $props();

	const baseClasses =
		'block w-full rounded-lg h-10 pl-9 pr-9 text-sm bg-white text-neutral-900 border border-neutral-300 dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-700 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-neutral-50 disabled:pointer-events-none disabled:opacity-50';
</script>

<div class={['relative', className]}>
	<Search
		size={16}
		class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
	/>
	<input type="text" bind:value class={baseClasses} {...rest} />
	{#if value}
		<button
			type="button"
			class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
			onclick={() => (value = '')}
			aria-label="Clear search"
		>
			<X size={16} />
		</button>
	{/if}
</div>
