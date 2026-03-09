<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import type { AppointmentListItem, AppointmentsResponse } from '$lib/types/appointment';
	import { CalendarX } from 'lucide-svelte';

	interface Props {
		data: {
			appointments: AppointmentListItem[];
			pagination: { page: number; totalPages: number; totalCount: number } | null;
		};
	}

	let { data }: Props = $props();

	let activeTab: 'upcoming' | 'past' = $state('upcoming');
	let pastAppointments: AppointmentListItem[] = $state([]);
	let pastPagination: { page: number; totalPages: number; totalCount: number } | null =
		$state(null);
	let pastLoading = $state(false);
	let pastLoaded = $state(false);

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

	const statusColors: Record<string, string> = {
		confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		completed: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
	};

	function getStatusClass(status: string): string {
		return statusColors[status] ?? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
	}

	async function fetchPast(page = 1) {
		pastLoading = true;
		try {
			const res = await fetch(`${env.PUBLIC_API_URL}/me/appointments?period=past&page=${page}`, {
				credentials: 'include'
			});
			if (res.ok) {
				const data: AppointmentsResponse = await res.json();
				if (page === 1) {
					pastAppointments = data.appointments;
				} else {
					pastAppointments = [...pastAppointments, ...data.appointments];
				}
				pastPagination = data.pagination;
			}
		} finally {
			pastLoading = false;
			pastLoaded = true;
		}
	}

	function switchTab(tab: 'upcoming' | 'past') {
		activeTab = tab;
		if (tab === 'past' && !pastLoaded) {
			fetchPast();
		}
	}

	let displayedAppointments = $derived(
		activeTab === 'upcoming' ? data.appointments : pastAppointments
	);
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">My Appointments</h1>

	<!-- Tabs -->
	<div class="mt-4 flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
		<button
			onclick={() => switchTab('upcoming')}
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
			'upcoming'
				? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
				: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'}"
		>
			Upcoming
		</button>
		<button
			onclick={() => switchTab('past')}
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
			'past'
				? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
				: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'}"
		>
			Past
		</button>
	</div>

	<!-- List -->
	<div class="mt-4 flex flex-col gap-3">
		{#if activeTab === 'past' && pastLoading && !pastLoaded}
			<p class="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
		{:else if displayedAppointments.length === 0}
			<div class="flex flex-col items-center gap-3 py-12 text-neutral-400 dark:text-neutral-500">
				<CalendarX size={40} />
				<p class="text-sm">
					{activeTab === 'upcoming'
						? 'Your upcoming appointments will appear here'
						: 'No past appointments'}
				</p>
			</div>
		{:else}
			{#each displayedAppointments as appointment (appointment.id)}
				<button
					onclick={() => goto(`/appointment/${appointment.id}`)}
					class="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
				>
					<Avatar
						src={appointment.specialist.avatarUrl}
						name={appointment.specialist.name}
						size="md"
					/>
					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between gap-2">
							<p class="font-medium text-neutral-900 dark:text-neutral-50">
								{appointment.specialist.name}
							</p>
							<span
								class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {getStatusClass(appointment.status)}"
							>
								{appointment.status}
							</span>
						</div>
						<p class="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
							{formatDate(appointment.date)} &middot; {formatTime(appointment.startTime)}–{formatTime(appointment.endTime)}
						</p>
						<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
							{appointment.services.map((s) => s.serviceName).join(', ')}
						</p>
						<p class="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50">
							{appointment.totalPrice} {appointment.currency}
						</p>
					</div>
				</button>
			{/each}

			<!-- Load more for past -->
			{#if activeTab === 'past' && pastPagination && pastPagination.page < pastPagination.totalPages}
				<button
					onclick={() => fetchPast(pastPagination!.page + 1)}
					disabled={pastLoading}
					class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
				>
					{pastLoading ? 'Loading...' : 'Load more'}
				</button>
			{/if}
		{/if}
	</div>
</div>
