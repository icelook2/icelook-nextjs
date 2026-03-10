<script lang="ts">
	import IconButtonLink from '$lib/components/ui/IconButtonLink.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
</script>

<PageHeader>
	{#snippet leading()}
		<IconButtonLink href="/search" aria-label="Go back">
			<span class="icon-[lucide--arrow-left] size-5"></span>
		</IconButtonLink>
	{/snippet}
	<h1 class="text-lg font-semibold">Specialist Profile</h1>
</PageHeader>
