<script lang="ts">
	import { page } from '$app/state';
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>@{page.params.nickname} Settings | Icelook</title>
</svelte:head>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/{page.params.nickname}" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Settings</h1>
</PageHeader>
