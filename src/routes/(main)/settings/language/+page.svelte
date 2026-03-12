<script lang="ts">
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import { m } from "$lib/paraglide/messages"
  import { setLocale, getLocale } from "$lib/paraglide/runtime"

  const locale = getLocale()
</script>

<svelte:head>
	<title>Language | Icelook</title>
</svelte:head>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/settings" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Language</h1>
</PageHeader>

<h1>{m.example_message({ username: "Roman" })}</h1>

<button onclick={() => setLocale("uk")} class={locale === "uk" ? "underline" : undefined}>
  Українська
</button>

<button onclick={() => setLocale("en")} class={locale === "en" ? "underline" : undefined}>
  English
</button>

