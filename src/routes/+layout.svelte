<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import favicon from '$lib/assets/favicon.svg';
	import { initTheme } from '$lib/theme.svelte';

	let { children, data } = $props();

	// Synchronous — sets theme state during SSR so the correct value is rendered
	initTheme(data.theme);

	// Reactive — re-applies if data.theme changes on client-side navigation
	$effect(() => {
		initTheme(data.theme);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
