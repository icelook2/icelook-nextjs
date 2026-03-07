<script lang="ts">
	import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-svelte';
	import { getTheme, setTheme, type Theme } from '$lib/theme.svelte.ts';

	const options: { value: Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];

	let current = $derived(getTheme());
</script>

<header class="flex items-center gap-3">
	<a
		href="/settings"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Appearance</h1>
</header>

<section class="mt-6">
	<h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Theme</h2>

	<fieldset class="mt-3 flex gap-3">
		<legend class="sr-only">Choose a theme</legend>

		{#each options as option (option.value)}
			{@const active = current === option.value}
			<label
				class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition-colors {active
					? 'border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800'
					: 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'}"
			>
				<input
					type="radio"
					name="theme"
					value={option.value}
					checked={active}
					onchange={() => setTheme(option.value)}
					class="sr-only"
				/>
				<option.icon size={24} class="text-neutral-900 dark:text-neutral-50" />
				<span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
					{option.label}
				</span>
			</label>
		{/each}
	</fieldset>
</section>
