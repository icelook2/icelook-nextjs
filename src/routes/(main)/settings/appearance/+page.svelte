<script lang="ts">
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import type { ThemeStore, AccentColor } from '$lib/theme/theme-store.svelte';
	import { getContext } from 'svelte';

	const themeStore = getContext<ThemeStore>("theme");

	const accentColors: { value: AccentColor; label: string; bg: string }[] = [
		{ value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
		{ value: 'green', label: 'Green', bg: 'bg-emerald-500' },
		{ value: 'yellow', label: 'Yellow', bg: 'bg-amber-500' },
		{ value: 'pink', label: 'Pink', bg: 'bg-pink-500' },
		{ value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
		{ value: 'purple', label: 'Purple', bg: 'bg-violet-500' },
	];
</script>

<svelte:head>
	<title>Appearance | Icelook</title>
</svelte:head>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/settings" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Appearance</h1>
</PageHeader>

<div class="flex flex-col gap-8 px-4 py-6">
	<section class="flex flex-col gap-3">
		<h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Theme</h2>
		<div class="flex gap-2">
			{#each [
				{ value: 'light', label: 'Light', icon: 'icon-[lucide--sun]' },
				{ value: 'dark', label: 'Dark', icon: 'icon-[lucide--moon]' },
				{ value: 'system', label: 'System', icon: 'icon-[lucide--monitor]' },
			] as option (option.value)}
				<button
					onclick={() => themeStore.setTheme(option.value)}
					class="flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all {themeStore.preference === option.value
						? 'border-accent-600 bg-accent-50 text-accent-700 dark:border-accent-500 dark:bg-accent-950 dark:text-accent-300'
						: 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600'}"
				>
					<span class="{option.icon} size-4"></span>
					{option.label}
				</button>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Accent color</h2>
		<div class="flex gap-3">
			{#each accentColors as color (color.value)}
				<button
					onclick={() => themeStore.setAccent(color.value)}
					aria-label={color.label}
					class="relative size-10 rounded-full {color.bg} transition-all hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
				>
					{#if themeStore.accent === color.value}
						<span class="icon-[lucide--check] absolute inset-0 m-auto size-5 text-white"></span>
					{/if}
				</button>
			{/each}
		</div>
	</section>
</div>
