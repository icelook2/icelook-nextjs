<script lang="ts">
	interface Option {
		value: number | string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: number | string;
		options: Option[];
		placeholder?: string;
		class?: string;
	}

	let { value = $bindable(), options, placeholder = 'Select...', class: className = '' }: Props = $props();
</script>

<select bind:value class="h-10 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-neutral-500 text-neutral-900 dark:text-neutral-50 {className}">
	{#if placeholder && value === undefined}
		<option disabled selected value={undefined}>{placeholder}</option>
	{/if}
	{#each options as option (option.value)}
		<option value={option.value} disabled={option.disabled}>{option.label}</option>
	{/each}
</select>

<style>
	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1rem;
		padding-right: 2.5rem;
	}

	:global(.dark) select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a3a3a3' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
	}
</style>
