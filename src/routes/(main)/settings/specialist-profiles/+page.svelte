<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Plus } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import IconButton from '$lib/components/ui/icon-button.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import CreateSpecialistProfileDialog from '$lib/components/create-specialist-profile-dialog.svelte';
	import type { MySpecialist } from '$lib/types/specialist';

	const specialists = $derived(page.data.specialists as MySpecialist[]);
	let dialogOpen = $state(false);

	async function setDefault(id: string) {
		await fetch(`/specialists/${id}/default`, { method: 'PATCH' });
		await invalidateAll();
	}
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/settings" />
	<h1 class="flex-1 text-xl font-semibold text-neutral-900 dark:text-neutral-50">Specialist Profiles</h1>
	{#if specialists.length < 3}
		<IconButton onclick={() => (dialogOpen = true)}>
			<Plus size={20} />
		</IconButton>
	{/if}
</header>

<div class="mt-6 divide-y divide-neutral-200 dark:divide-neutral-700">
	{#each specialists as specialist (specialist.id)}
		<div class="flex items-center gap-3 px-3 py-3">
			<a href="/{specialist.nickname}" class="flex min-w-0 flex-1 items-center gap-3">
				<Avatar src={specialist.avatarUrl} name={specialist.name} size="md" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{specialist.name}</p>
					<p class="text-xs text-neutral-500 dark:text-neutral-400">@{specialist.nickname}</p>
				</div>
			</a>
			<div class="flex shrink-0 items-center gap-2">
				{#if specialist.isDefault}
					<span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Default</span>
				{:else}
					<DropdownMenu
						items={[
							{
								label: 'Make default',
								onclick: () => setDefault(specialist.id)
							}
						]}
					/>
				{/if}
			</div>
		</div>
	{/each}
</div>

<CreateSpecialistProfileDialog bind:open={dialogOpen} />
