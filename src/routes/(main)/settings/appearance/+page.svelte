<script lang="ts">
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
    import type { ThemeStore } from '$lib/theme/theme-store.svelte';
    import { getContext } from 'svelte';

  const themeStore = getContext<ThemeStore>("theme")
</script>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/settings" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Appearance</h1>
</PageHeader>

<button 
  onclick={() => themeStore.setTheme("dark")} 
  class={themeStore.preference === "dark" ? "underline" : undefined}
>
  Dark
</button>

<button
  onclick={() => themeStore.setTheme("light")} 
  class={themeStore.preference === "light" ? "underline" : undefined}
>
  Light
</button>

<button 
  onclick={() => themeStore.setTheme("system")} 
  class={themeStore.preference === "system" ? "underline" : undefined}
>
  System
</button>
