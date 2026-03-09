<script lang="ts">
	import Avatar from '$lib/components/ui/avatar.svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import type { SpecialistAppointmentDetail } from '$lib/types/appointment';
	import { page } from '$app/state';

	interface Props {
		data: {
			appointment: SpecialistAppointmentDetail;
		};
	}

	let { data }: Props = $props();

	const appointment = $derived(data.appointment);

	function formatTime(minutes: number): string {
		const h = Math.floor(minutes / 60)
			.toString()
			.padStart(2, '0');
		const m = (minutes % 60).toString().padStart(2, '0');
		return `${h}:${m}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
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
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	<header class="flex items-center gap-3">
		<BackButton fallback="/{page.params.nickname}/schedule" />
		<h1 class="flex-1 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
			Appointment Details
		</h1>
	</header>

	<!-- Status -->
	<div class="mt-6">
		<span
			class="inline-block rounded-full px-3 py-1 text-sm font-medium {getStatusClass(appointment.status)}"
		>
			{appointment.status}
		</span>
	</div>

	<!-- Client -->
	<div class="mt-6 flex items-center gap-3">
		<Avatar
			src={appointment.user.imageUrl}
			name={appointment.user.name}
			size="lg"
		/>
		<div>
			<p class="font-medium text-neutral-900 dark:text-neutral-50">
				{appointment.user.name}
			</p>
		</div>
	</div>

	<!-- Date & Time -->
	<div
		class="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
	>
		<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Date & Time</p>
		<p class="mt-1 text-neutral-900 dark:text-neutral-50">{formatDate(appointment.date)}</p>
		<p class="mt-0.5 text-neutral-900 dark:text-neutral-50">
			{formatTime(appointment.startTime)}–{formatTime(appointment.endTime)}
		</p>
		<p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{appointment.timezone}</p>
	</div>

	<!-- Services -->
	<div class="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
		<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Services</p>
		<ul class="mt-2 flex flex-col gap-2">
			{#each appointment.services as service, i (i)}
				<li class="flex items-center justify-between">
					<div>
						<p class="text-neutral-900 dark:text-neutral-50">{service.serviceName}</p>
						<p class="text-sm text-neutral-500 dark:text-neutral-400">
							{service.duration} min
						</p>
					</div>
					<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
						{service.priceAmount} {appointment.currency}
					</p>
				</li>
			{/each}
		</ul>
		<div
			class="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700"
		>
			<p class="font-medium text-neutral-900 dark:text-neutral-50">Total</p>
			<p class="font-medium text-neutral-900 dark:text-neutral-50">
				{appointment.totalPrice} {appointment.currency}
			</p>
		</div>
	</div>

	<!-- Last Appointment -->
	{#if appointment.lastAppointment}
		<div class="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
			<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Last Appointment</p>
			<div class="mt-3 flex items-center justify-between">
				<div>
					<p class="text-neutral-900 dark:text-neutral-50">{formatDate(appointment.lastAppointment.date)}</p>
					<p class="text-sm text-neutral-500 dark:text-neutral-400">
						{formatTime(appointment.lastAppointment.startTime)}–{formatTime(appointment.lastAppointment.endTime)}
					</p>
				</div>
				<div class="text-right">
					<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
						{appointment.lastAppointment.totalPrice} {appointment.lastAppointment.currency}
					</p>
					<p class="text-xs text-neutral-500 dark:text-neutral-400">
						{appointment.lastAppointment.status}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Cancel reason -->
	{#if appointment.status === 'cancelled' && appointment.cancelReason}
		<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
			<p class="text-sm font-medium text-red-800 dark:text-red-200">Cancellation Reason</p>
			<p class="mt-1 text-sm text-red-700 dark:text-red-300">{appointment.cancelReason}</p>
			{#if appointment.cancelDescription}
				<p class="mt-1 text-sm text-red-600 dark:text-red-400">{appointment.cancelDescription}</p>
			{/if}
			{#if appointment.cancelledBy}
				<p class="mt-1 text-xs text-red-500 dark:text-red-400">
					Cancelled by: {appointment.cancelledBy}
				</p>
			{/if}
		</div>
	{/if}
</div>
