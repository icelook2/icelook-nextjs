<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		type?: string;
		value?: string;
	}

	let { type = 'text', class: className, value = $bindable(''), ...rest }: Props = $props();

	const baseClasses =
		'block w-full rounded-lg h-10 px-3 text-sm bg-white text-neutral-900 border border-neutral-300 dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-700 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-neutral-50 disabled:pointer-events-none disabled:opacity-50';
</script>

<input {type} bind:value class={[baseClasses, className]} {...rest} />
