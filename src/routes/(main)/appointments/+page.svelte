<script lang="ts">
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<svelte:head>
	<title>Appointments | Icelook</title>
</svelte:head>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Appointments</h1>
</PageHeader>
