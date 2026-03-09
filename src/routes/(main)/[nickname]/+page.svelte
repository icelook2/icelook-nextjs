<script lang="ts">
	import { Info, Settings, Star } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import EditProfileDialog from '$lib/components/edit-profile-dialog.svelte';
	import ContactsDialog from '$lib/components/contacts-dialog.svelte';
	import CreateAppointmentDialog from '$lib/components/create-appointment-dialog.svelte';
	import type { Service } from '$lib/types/specialist';

	const { data } = $props();
	const specialist = $derived(data.specialist);
	const isOwner = $derived(Number(data.user.id) === specialist.userId);

	let editProfileOpen = $state(false);
	let contactsOpen = $state(false);
	let bookingDialogOpen = $state(false);

	let selected: Record<number, boolean> = $state({});

	const selectedServiceIds = $derived(
		Object.entries(selected)
			.filter(([, v]) => v)
			.map(([k]) => Number(k))
	);

	function formatPrice(price: number): string {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: specialist.currency
		}).format(price);
	}

	function formatDuration(minutes: number): string {
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m ? `${h}h ${m}min` : `${h}h`;
	}
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	<!-- Page header -->
	<header class="flex items-center gap-3">
		<BackButton fallback="/search" />
		<div>
			<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
				{specialist.name}
			</h1>
			<p class="text-sm text-neutral-500 dark:text-neutral-400">@{specialist.nickname}</p>
		</div>
		{#if isOwner}
			<a
				href="/{specialist.nickname}/settings"
				class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
			>
				<Settings size={20} />
			</a>
		{/if}
	</header>

	<!-- Profile header -->
	<section class="mt-6 flex items-center gap-4">
		<Avatar src={specialist.avatarUrl} name={specialist.name} size="xl" />
		<div>
			<p class="font-medium text-neutral-900 dark:text-neutral-50">{specialist.name}</p>
			<p class="text-sm text-neutral-500 dark:text-neutral-400">@{specialist.nickname}</p>
		</div>
	</section>

	<div class="mt-4 flex items-center gap-2">
		{#if isOwner}
			<Button variant="outline" size="sm" onclick={() => (editProfileOpen = true)}>
				Edit Profile
			</Button>
		{/if}

		<Button variant="outline" size="sm">
			<Star size={14} class="fill-yellow-400 text-yellow-400" />
			{#if specialist.totalReviews > 0}
				{specialist.averageRating} ({specialist.totalReviews})
			{:else}
				No reviews
			{/if}
		</Button>

		<Button variant="outline" size="sm" onclick={() => (contactsOpen = true)}>
			Contacts
		</Button>
	</div>

	{#if specialist.bio}
		<p class="mt-4 text-sm text-neutral-600 dark:text-neutral-400">{specialist.bio}</p>
	{/if}

	<!-- Services -->
	<div class="mt-8 space-y-6">
		{#each specialist.serviceGroups as group (group.id)}
			<section>
				<h2
					class="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
				>
					{group.name}
				</h2>
				<ul class="divide-y divide-neutral-200 dark:divide-neutral-700">
					{#each group.services as service (service.id)}
						{@render serviceRow(service)}
					{/each}
				</ul>
			</section>
		{/each}

		{#if specialist.ungroupedServices.length > 0}
			<section>
				{#if specialist.serviceGroups.length > 0}
					<h2
						class="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400"
					>
						Other
					</h2>
				{/if}
				<ul class="divide-y divide-neutral-200 dark:divide-neutral-700">
					{#each specialist.ungroupedServices as service (service.id)}
						{@render serviceRow(service)}
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</div>

<EditProfileDialog bind:open={editProfileOpen} {specialist} />
<ContactsDialog bind:open={contactsOpen} {specialist} editable={isOwner} />
<CreateAppointmentDialog bind:open={bookingDialogOpen} {specialist} {selectedServiceIds} />

{#if selectedServiceIds.length > 0}
	<div class="fixed bottom-20 sm:bottom-6 right-4 flex items-center gap-2 z-40 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl px-3 py-2 border border-neutral-200 dark:border-neutral-800">
		<span class="text-sm font-medium">{selectedServiceIds.length} service(s)</span>
		<Button variant="outline" size="sm" onclick={() => (selected = {})}>Clear</Button>
		<Button size="sm" onclick={() => (bookingDialogOpen = true)}>Book</Button>
	</div>
{/if}

{#snippet serviceRow(service: Service)}
	<li class="flex items-center gap-3 py-3">
		<Checkbox checked={selected[service.id] ?? false} onclick={() => selected[service.id] = !selected[service.id]} />
		<span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{service.name}</span>
		<span class="ml-auto text-sm text-neutral-500 dark:text-neutral-400">{formatPrice(service.priceAmount)}</span>
		{#if service.description}
			<Info class="h-4 w-4 text-neutral-400" />
		{/if}
	</li>
{/snippet}
