<script lang="ts">
  import "../app.css";
  import { setContext } from "svelte";
  import { ThemeStore } from "$lib/theme/theme-store.svelte"

	let { children, data } = $props();

  setContext<ThemeStore>('theme', new ThemeStore(() => ({ theme: data.theme, accent: data.accent })));
</script>

<svelte:head>
	<title>Icelook</title>
</svelte:head>

{@render children()}
