<script lang="ts">
	import { format, parseISO, getDaysInMonth, getDay, addMonths, subMonths, isBefore, startOfDay, isSameMonth, getYear, isSameDay } from 'date-fns';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	import Dialog from './ui/dialog.svelte';
	import Button from './ui/button.svelte';
	import Textarea from './ui/textarea.svelte';
	import IconButton from './ui/icon-button.svelte';
	import { ChevronLeft, ChevronRight, X, Loader2, Check, Clock, ArrowLeft } from 'lucide-svelte';
	import type { Specialist, Service } from '$lib/types/specialist';

	interface Props {
		open?: boolean;
		specialist: Specialist;
		selectedServiceIds: number[];
	}

	let { open = $bindable(false), specialist, selectedServiceIds }: Props = $props();

	type Step = 'date' | 'timeslot' | 'confirm' | 'done';

	let step = $state<Step>('date');
	let calendarMonth = $state(new Date());
	let selectedDate = $state<string | null>(null); // 'yyyy-MM-dd'
	let availableDays = $state<string[]>([]);
	let loadingAvailableDays = $state(false);
	let availableTimeSlots = $state<number[]>([]);
	let loadingTimeSlots = $state(false);
	let selectedStartTime = $state<number | null>(null);
	let notes = $state('');
	let loading = $state(false);
	let bookedAppointment = $state<{ id: number; status: string } | null>(null);

	function reset() {
		step = 'date';
		selectedDate = null;
		availableDays = [];
		availableTimeSlots = [];
		selectedStartTime = null;
		notes = '';
		loading = false;
		bookedAppointment = null;
		calendarMonth = new Date();
	}

	$effect(() => {
		if (!open) reset();
	});

	// Fetch available days when dialog opens and prefetch next month
	$effect(() => {
		if (open) {
			fetchAvailableDays(format(calendarMonth, 'yyyy-MM'));
			prefetchMonth(format(addMonths(calendarMonth, 1), 'yyyy-MM'));
		}
	});

	// Calendar grid derivation
	const calendarGrid = $derived.by(() => {
		const year = calendarMonth.getFullYear();
		const month = calendarMonth.getMonth();
		const firstDayUTC = new Date(Date.UTC(year, month, 1));
		const dow = getDay(firstDayUTC);
		const offset = (dow + 6) % 7;
		const daysInMonth = getDaysInMonth(firstDayUTC);
		return Array.from({ length: 42 }, (_, i) => {
			const day = i - offset + 1;
			return day >= 1 && day <= daysInMonth ? day : null;
		});
	});

	function isPastDay(day: number): boolean {
		const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
		const today = startOfDay(new Date());
		return isBefore(cellDate, today);
	}

	function isUnavailableDay(day: number): boolean {
		const dateStr = format(
			new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day),
			'yyyy-MM-dd'
		);
		return !availableDays.includes(dateStr);
	}

	function isSelectedDate(day: number): boolean {
		if (!selectedDate) return false;
		const dateStr = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd');
		return dateStr === selectedDate;
	}

	function isToday(day: number): boolean {
		const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
		return isSameDay(cellDate, new Date());
	}

	function selectDate(day: number) {
		if (isPastDay(day) || isUnavailableDay(day)) return;
		selectedDate = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd');
	}

	async function fetchAvailableDays(month: string) {
		loadingAvailableDays = true;
		const serviceIds = selectedServiceIds.join(',');
		try {
			const res = await fetch(
				`${PUBLIC_API_URL}/specialists/${specialist.id}/available-days?month=${month}&serviceIds=${serviceIds}`,
				{ credentials: 'include' }
			);
			const data = (await res.json()) as { availableDays: string[] };
			availableDays = data.availableDays;
		} catch (err) {
			console.error('Error fetching available days:', err);
		} finally {
			loadingAvailableDays = false;
		}
	}

	function prefetchMonth(month: string) {
		const serviceIds = selectedServiceIds.join(',');
		fetch(
			`${PUBLIC_API_URL}/specialists/${specialist.id}/available-days?month=${month}&serviceIds=${serviceIds}`,
			{ credentials: 'include' }
		).catch(() => {});
	}

	async function fetchAvailableTimeSlots() {
		if (!selectedDate) return;
		loadingTimeSlots = true;
		const serviceIds = selectedServiceIds.join(',');
		try {
			const res = await fetch(
				`${PUBLIC_API_URL}/specialists/${specialist.id}/available-time-slots?date=${selectedDate}&serviceIds=${serviceIds}`,
				{ credentials: 'include' }
			);
			const data = (await res.json()) as { timeSlots: number[] };
			availableTimeSlots = data.timeSlots;
			step = 'timeslot';
		} catch (err) {
			console.error('Error fetching available time slots:', err);
		} finally {
			loadingTimeSlots = false;
		}
	}

	function goToPrevMonth() {
		const newMonth = subMonths(calendarMonth, 1);
		calendarMonth = newMonth;
		selectedDate = null;
		fetchAvailableDays(format(newMonth, 'yyyy-MM'));
		prefetchMonth(format(subMonths(newMonth, 1), 'yyyy-MM'));
	}

	function goToNextMonth() {
		const newMonth = addMonths(calendarMonth, 1);
		calendarMonth = newMonth;
		selectedDate = null;
		fetchAvailableDays(format(newMonth, 'yyyy-MM'));
		prefetchMonth(format(addMonths(newMonth, 1), 'yyyy-MM'));
	}

	function formatTime(minutes: number): string {
		const h = Math.floor(minutes / 60).toString().padStart(2, '0');
		const m = (minutes % 60).toString().padStart(2, '0');
		return `${h}:${m}`;
	}

	function getTimeOfDay(minutes: number): 'morning' | 'afternoon' | 'evening' {
		if (minutes < 720) return 'morning'; // Before 12:00
		if (minutes < 1080) return 'afternoon'; // 12:00 - 18:00
		return 'evening'; // 18:00+
	}

	const groupedTimeSlots = $derived.by(() => {
		const morning: number[] = [];
		const afternoon: number[] = [];
		const evening: number[] = [];

		for (const slot of availableTimeSlots) {
			const period = getTimeOfDay(slot);
			if (period === 'morning') morning.push(slot);
			else if (period === 'afternoon') afternoon.push(slot);
			else evening.push(slot);
		}

		return { morning, afternoon, evening };
	});

	// Get selected service objects
	function getSelectedServices(): Service[] {
		const services: Service[] = [];
		for (const group of specialist.serviceGroups) {
			for (const service of group.services) {
				if (selectedServiceIds.includes(service.id)) {
					services.push(service);
				}
			}
		}
		for (const service of specialist.ungroupedServices) {
			if (selectedServiceIds.includes(service.id)) {
				services.push(service);
			}
		}
		return services;
	}

	async function book() {
		if (!selectedDate || selectedStartTime === null) return;
		loading = true;
		try {
			const services = getSelectedServices().map(s => ({ id: s.id, expectedPrice: s.priceAmount }));
			const res = await fetch(`${PUBLIC_API_URL}/specialists/${specialist.id}/appointments`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					services,
					date: selectedDate,
					startTime: selectedStartTime
				})
			});
			const data = (await res.json()) as { appointment: { id: number; status: string } };
			bookedAppointment = { id: data.appointment.id, status: data.appointment.status };
			loading = false;
			step = 'done';
		} catch (err) {
			console.error('Error booking appointment:', err);
			loading = false;
		}
	}

	async function viewAppointment() {
		if (bookedAppointment) {
			open = false;
			await goto(`/appointment/${bookedAppointment.id}`);
		}
	}
</script>

<Dialog bind:open>
	{#snippet header()}
		<div class="flex items-center gap-3">
			<!-- Back button -->
			{#if step === 'timeslot' || step === 'confirm'}
				<IconButton
					onclick={() => {
						if (step === 'timeslot') step = 'date';
						else if (step === 'confirm') step = 'timeslot';
					}}
					aria-label="Go back"
				>
					<ArrowLeft size={20} />
				</IconButton>
			{:else if step === 'date' || step === 'done'}
				<!-- No back button for date or done -->
			{/if}

			<!-- Title -->
			<h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
				{#if step === 'date'}
					Select a date
				{:else if step === 'timeslot'}
					Select a time
				{:else if step === 'confirm'}
					Confirm booking
				{:else if step === 'done'}
					Booking request
				{/if}
			</h2>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Close button -->
			{#if step !== 'done'}
				<IconButton onclick={() => (open = false)} aria-label="Close">
					<X size={20} />
				</IconButton>
			{/if}
		</div>
	{/snippet}

	<!-- Date Step -->
	{#if step === 'date'}
		<div class="space-y-4">
			<!-- Month Navigation -->
			<div class="flex items-center justify-between">
				<h3 class="font-medium text-neutral-900 dark:text-neutral-50">
					{getYear(calendarMonth) === getYear(new Date())
						? format(calendarMonth, 'MMMM')
						: format(calendarMonth, 'MMMM yyyy')}
				</h3>
				<div class="flex gap-1">
					<IconButton
						onclick={goToPrevMonth}
						aria-label="Previous month"
					>
						<ChevronLeft size={20} />
					</IconButton>
					<IconButton
						onclick={goToNextMonth}
						aria-label="Next month"
					>
						<ChevronRight size={20} />
					</IconButton>
				</div>
			</div>

			<!-- Calendar Grid -->
			<div>
				<div class="grid grid-cols-7 gap-1 mb-2">
					{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as label, i (i)}
						<div class="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 h-8 flex items-center justify-center">
							{label}
						</div>
					{/each}
				</div>

				{#if loadingAvailableDays}
					<div class="flex items-center justify-center py-3">
						<Loader2 size={16} class="animate-spin text-neutral-400" />
					</div>
				{:else}
					<div class="grid grid-cols-7 gap-1">
						{#each calendarGrid as day, i (i)}
							{#if day !== null}
								<button
									onclick={() => selectDate(day)}
									disabled={isPastDay(day) || isUnavailableDay(day)}
									class="h-8 rounded-full text-sm font-medium transition-colors {isPastDay(day) || isUnavailableDay(day)
										? 'line-through opacity-40 cursor-not-allowed text-neutral-500 dark:text-neutral-400'
										: isSelectedDate(day)
											? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
											: isToday(day)
												? 'ring-2 ring-neutral-900 dark:ring-neutral-50 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
												: 'text-neutral-900 hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800'}"
								>
									{day}
								</button>
							{:else}
								<div class="h-8"></div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Timeslot Step -->
	{#if step === 'timeslot'}
		<div class="space-y-4">
			{#if loadingTimeSlots}
				<div class="flex items-center justify-center py-6">
					<Loader2 size={20} class="animate-spin text-neutral-400" />
				</div>
			{:else if availableTimeSlots.length === 0}
				<div class="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<p class="text-sm text-yellow-800 dark:text-yellow-200">No available time slots for this day</p>
				</div>
			{:else}
				{#if groupedTimeSlots.morning.length > 0}
					<div>
						<h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Morning</h3>
						<div class="flex flex-wrap gap-2">
							{#each groupedTimeSlots.morning as slot (slot)}
								<button
									onclick={() => (selectedStartTime = slot)}
									class="px-3 py-2 text-sm font-medium rounded-full border transition-colors {selectedStartTime === slot
										? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 dark:border-neutral-50'
										: 'border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800'}"
								>
									{formatTime(slot)}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if groupedTimeSlots.afternoon.length > 0}
					<div>
						<h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Afternoon</h3>
						<div class="flex flex-wrap gap-2">
							{#each groupedTimeSlots.afternoon as slot (slot)}
								<button
									onclick={() => (selectedStartTime = slot)}
									class="px-3 py-2 text-sm font-medium rounded-full border transition-colors {selectedStartTime === slot
										? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 dark:border-neutral-50'
										: 'border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800'}"
								>
									{formatTime(slot)}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if groupedTimeSlots.evening.length > 0}
					<div>
						<h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Evening</h3>
						<div class="flex flex-wrap gap-2">
							{#each groupedTimeSlots.evening as slot (slot)}
								<button
									onclick={() => (selectedStartTime = slot)}
									class="px-3 py-2 text-sm font-medium rounded-full border transition-colors {selectedStartTime === slot
										? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 dark:border-neutral-50'
										: 'border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800'}"
								>
									{formatTime(slot)}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- Confirm Step -->
	{#if step === 'confirm'}
		<div class="space-y-6">
			<!-- Services -->
			<div>
				<h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Services</h3>
				<ul class="divide-y divide-neutral-200 dark:divide-neutral-700">
					{#each getSelectedServices() as service (service.id)}
						<li class="py-2">
							<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{service.name}</p>
							<p class="text-xs text-neutral-500 dark:text-neutral-400">{service.duration} min</p>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Date & Time -->
			<div>
				<h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Date & Time</h3>
				<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
					{selectedDate ? format(parseISO(selectedDate), 'MMMM d, yyyy') : ''}
				</p>
				<p class="text-sm text-neutral-600 dark:text-neutral-400">
					{selectedStartTime !== null ? formatTime(selectedStartTime) : ''} – {selectedStartTime !== null ? formatTime(selectedStartTime + 30) : ''}
				</p>
			</div>

			<!-- Notes -->
			<div>
				<label for="notes" class="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
					Notes (optional)
				</label>
				<Textarea id="notes" placeholder="Add any notes for the specialist..." bind:value={notes} />
			</div>
		</div>
	{/if}

	<!-- Done Step -->
	{#if step === 'done'}
		<div class="space-y-4 text-center">
			<div class="flex justify-center">
				{#if bookedAppointment?.status === 'confirmed'}
					<div class="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
						<Check size={32} class="text-green-600 dark:text-green-400" />
					</div>
				{:else}
					<div class="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
						<Clock size={32} class="text-blue-600 dark:text-blue-400" />
					</div>
				{/if}
			</div>

			<div>
				{#if bookedAppointment?.status === 'confirmed'}
					<h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
						Appointment booked successfully!
					</h3>
				{:else}
					<h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
						The specialist needs to confirm your appointment
					</h3>
				{/if}
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex gap-3 justify-end">
			{#if step === 'date'}
				<Button
					onclick={fetchAvailableTimeSlots}
					disabled={!selectedDate || loadingTimeSlots}
					class="flex items-center gap-2"
				>
					{#if loadingTimeSlots}
						<Loader2 size={16} class="animate-spin" />
					{/if}
					Next
				</Button>
			{:else if step === 'timeslot'}
				<Button onclick={() => (step = 'confirm')} disabled={selectedStartTime === null}>
					Next
				</Button>
			{:else if step === 'confirm'}
				<Button onclick={book} disabled={loading} class="flex items-center gap-2">
					{#if loading}
						<Loader2 size={16} class="animate-spin" />
					{/if}
					Confirm
				</Button>
			{:else if step === 'done'}
				<Button onclick={viewAppointment}>View Appointment</Button>
			{/if}
		</div>
	{/snippet}
</Dialog>
