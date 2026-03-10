<script lang="ts">
  import "../app.css";
	import favicon from '$lib/assets/favicon.svg';
    import { setContext } from "svelte";
  import { ThemeStore } from "$lib/theme/theme-store.svelte"

	let { children, data } = $props();

  setContext<ThemeStore>('theme', new ThemeStore(() => data.theme));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
