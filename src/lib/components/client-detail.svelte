<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import type { ClientDetails, ClientAppointmentItem } from '$lib/types/client';
	import {
		Ban,
		ShieldCheck,
		Phone,
		MessageCircle,
		Send,
		Instagram,
		Calendar,
		Clock
	} from 'lucide-svelte';

	interface Props {
		specialistId: string;
		userId: number;
		nickname: string;
		backUrl: string;
		client: ClientDetails;
		upcomingAppointments: ClientAppointmentItem[];
		pastAppointments: ClientAppointmentItem[];
	}

	let {
		specialistId,
		userId,
		nickname,
		backUrl,
		client,
		upcomingAppointments,
		pastAppointments
	}: Props = $props();

	let note = $state('');
	let noteSaving = $state(false);
	let noteSaved = $state(false);
	let blockLoading = $state(false);

	let isBlocked = $derived(client.blockedAt !== null);

	$effect(() => {
		note = client.note ?? '';
	});

	function formatTime(minutes: number): string {
		const h = Math.floor(minutes / 60)
			.toString()
			.padStart(2, '0');
		const m = (minutes % 60).toString().padStart(2, '0');
		return `${h}:${m}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function formatFullDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const statusColors: Record<string, string> = {
		confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		completed: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
	};

	function getStatusClass(status: string): string {
		return (
			statusColors[status] ??
			'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
		);
	}

	async function toggleBlock() {
		blockLoading = true;
		try {
			const action = isBlocked ? 'unblock' : 'block';
			const res = await fetch(
				`${env.PUBLIC_API_URL}/specialists/${specialistId}/clients/${userId}/${action}`,
				{ method: 'PATCH', credentials: 'include' }
			);
			if (res.ok) {
				await invalidateAll();
			}
		} finally {
			blockLoading = false;
		}
	}

	async function saveNote() {
		noteSaving = true;
		noteSaved = false;
		try {
			const res = await fetch(
				`${env.PUBLIC_API_URL}/specialists/${specialistId}/clients/${userId}/note`,
				{
					method: 'PATCH',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ note: note || null })
				}
			);
			if (res.ok) {
				noteSaved = true;
				setTimeout(() => (noteSaved = false), 2000);
			}
		} finally {
			noteSaving = false;
		}
	}

	const contacts = $derived(
		[
			{ label: 'Phone 1', value: client.contacts.phone1, icon: Phone },
			{ label: 'Phone 2', value: client.contacts.phone2, icon: Phone },
			{ label: 'Instagram', value: client.contacts.instagram, icon: Instagram },
			{ label: 'Telegram', value: client.contacts.telegram, icon: Send },
			{ label: 'WhatsApp', value: client.contacts.whatsapp, icon: MessageCircle },
			{ label: 'Viber', value: client.contacts.viber, icon: MessageCircle }
		].filter((c) => c.value)
	);
</script>

<header class="flex items-center gap-3">
	<BackButton fallback={backUrl} />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">{client.name}</h1>
</header>

<!-- Profile card -->
<div class="mt-6 flex items-center gap-4">
	<Avatar src={client.image} name={client.name} size="xl" />
	<div>
		<p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{client.name}</p>
		{#if client.email}
			<p class="text-sm text-neutral-500 dark:text-neutral-400">{client.email}</p>
		{/if}
		<p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
			Client since {formatFullDate(client.createdAt)}
		</p>
	</div>
</div>

<!-- Block/Unblock -->
<div class="mt-6">
	<button
		onclick={toggleBlock}
		disabled={blockLoading}
		class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 {isBlocked
			? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
			: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'}"
	>
		{#if isBlocked}
			<ShieldCheck size={16} />
			{blockLoading ? 'Unblocking...' : 'Unblock client'}
		{:else}
			<Ban size={16} />
			{blockLoading ? 'Blocking...' : 'Block client'}
		{/if}
	</button>
</div>

<!-- Note -->
<section class="mt-6">
	<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">Note</h2>
	<textarea
		bind:value={note}
		placeholder="Add a private note about this client..."
		rows="3"
		class="mt-2 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder-neutral-500 dark:focus:border-neutral-500"
	></textarea>
	<div class="mt-2 flex items-center gap-2">
		<button
			onclick={saveNote}
			disabled={noteSaving}
			class="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
		>
			{noteSaving ? 'Saving...' : 'Save note'}
		</button>
		{#if noteSaved}
			<span class="text-sm text-green-600 dark:text-green-400">Saved</span>
		{/if}
	</div>
</section>

<!-- Preferences -->
{#if client.preferences.prefersMinimalConversation}
	<section class="mt-6">
		<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">Preferences</h2>
		<div class="mt-2">
			<span
				class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
			>
				Prefers minimal conversation
			</span>
		</div>
	</section>
{/if}

<!-- Contacts -->
{#if contacts.length > 0}
	<section class="mt-6">
		<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">Contacts</h2>
		<div class="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
			{#each contacts as contact (contact.label)}
				<div class="flex items-center gap-3 py-2.5">
					<contact.icon size={16} class="shrink-0 text-neutral-400 dark:text-neutral-500" />
					<div>
						<p class="text-xs text-neutral-500 dark:text-neutral-400">{contact.label}</p>
						<p class="text-sm text-neutral-900 dark:text-neutral-50">{contact.value}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<!-- Upcoming appointments -->
<section class="mt-6">
	<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
		Upcoming appointments
	</h2>
	{#if upcomingAppointments.length === 0}
		<div class="mt-3 flex items-center gap-2 py-4 text-neutral-400 dark:text-neutral-500">
			<Calendar size={16} />
			<p class="text-sm">No upcoming appointments</p>
		</div>
	{:else}
		<div class="mt-3 flex flex-col gap-2">
			{#each upcomingAppointments as appt (appt.id)}
				<div
					class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2">
							<Clock size={14} class="shrink-0 text-neutral-400" />
							<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
								{formatDate(appt.date)} &middot; {formatTime(appt.startTime)}–{formatTime(appt.endTime)}
							</p>
						</div>
						<span
							class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {getStatusClass(appt.status)}"
						>
							{appt.status}
						</span>
					</div>
					<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
						{appt.services.map((s) => s.serviceName).join(', ')}
					</p>
					<p class="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50">
						{appt.totalPrice} {appt.currency}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- Past appointments -->
<section class="mt-6">
	<h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-50">Past appointments</h2>
	{#if pastAppointments.length === 0}
		<div class="mt-3 flex items-center gap-2 py-4 text-neutral-400 dark:text-neutral-500">
			<Calendar size={16} />
			<p class="text-sm">No past appointments</p>
		</div>
	{:else}
		<div class="mt-3 flex flex-col gap-2">
			{#each pastAppointments as appt (appt.id)}
				<div
					class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2">
							<Clock size={14} class="shrink-0 text-neutral-400" />
							<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
								{formatDate(appt.date)} &middot; {formatTime(appt.startTime)}–{formatTime(appt.endTime)}
							</p>
						</div>
						<span
							class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {getStatusClass(appt.status)}"
						>
							{appt.status}
						</span>
					</div>
					<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
						{appt.services.map((s) => s.serviceName).join(', ')}
					</p>
					<p class="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50">
						{appt.totalPrice} {appt.currency}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</section>
