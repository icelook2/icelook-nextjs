<script lang="ts">
	import BackButton from '$lib/components/ui/back-button.svelte';
	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime.js';

	const options: { value: Locale; label: string }[] = [
		{ value: 'en', label: 'English' },
		{ value: 'uk', label: 'Українська' }
	];

	let current = $derived(getLocale());
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/settings" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Language</h1>
</header>

<section class="mt-6">
	<fieldset class="mt-3 flex gap-3">
		<legend class="sr-only">Choose a language</legend>

		{#each options as option (option.value)}
			{@const active = current === option.value}
			<label
				class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition-colors {active
					? 'border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800'
					: 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'}"
			>
				<input
					type="radio"
					name="language"
					value={option.value}
					checked={active}
					onchange={() => setLocale(option.value)}
					class="sr-only"
				/>
				<span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
					{option.label}
				</span>
			</label>
		{/each}
	</fieldset>
</section>
