<script lang="ts">
	import { Plus, Coffee, Pencil, Trash2 } from 'lucide-svelte';
	import Avatar from './ui/avatar.svelte';
	import IconButton from './ui/icon-button.svelte';
	import type { WorkingDay, Break, Appointment } from '$lib/types/working-day';

	interface Props {
		workingDay: WorkingDay;
		nickname: string;
	}

	let { workingDay, nickname } = $props();

	type Slot =
		| { type: 'available'; time: number; availableFor: number }
		| { type: 'break'; time: number; breakData: Break }
		| { type: 'appointment'; time: number; apptData: Appointment };

	function minutesToTimeStr(m: number): string {
		return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
	}

	function formatDuration(m: number): string {
		const h = Math.floor(m / 60);
		const min = m % 60;
		if (h === 0) return `${min}min`;
		if (min === 0) return `${h}h`;
		return `${h}h ${min}min`;
	}

	function generateSlots(): Slot[] {
		const slots: Slot[] = [];
		const { startTime, endTime, timeStep, breaks, appointments } = workingDay;

		for (let t = startTime; t < endTime; t += timeStep) {
			// Check if this is the start of a break
			const breakAtTime = breaks.find((b) => t >= b.startTime && t < b.endTime);
			if (breakAtTime && t === breakAtTime.startTime) {
				slots.push({ type: 'break', time: t, breakData: breakAtTime });
				continue;
			}

			// Check if we're inside a break (but not at its start)
			if (breakAtTime) {
				continue;
			}

			// Check if this is the start of an appointment
			const apptAtTime = appointments.find((a) => t >= a.startTime && t < a.endTime);
			if (apptAtTime && t === apptAtTime.startTime) {
				slots.push({ type: 'appointment', time: t, apptData: apptAtTime });
				continue;
			}

			// Check if we're inside an appointment (but not at its start)
			if (apptAtTime) {
				continue;
			}

			// Available slot
			const nextBreak = breaks.filter((b) => b.startTime >= t).sort((a, b) => a.startTime - b.startTime)[0];
			const nextAppt = appointments.filter((a) => a.startTime >= t).sort((a, b) => a.startTime - b.startTime)[0];

			const nextBreakStart = nextBreak ? nextBreak.startTime : endTime;
			const nextApptStart = nextAppt ? nextAppt.startTime : endTime;
			const nextEventStart = Math.min(nextBreakStart, nextApptStart, endTime);

			const availableFor = nextEventStart - t;

			slots.push({ type: 'available', time: t, availableFor });
		}

		return slots;
	}

	const slots = $derived(generateSlots());
</script>

<div class="w-full">
	{#each slots as slot (slot.time)}
		{#if slot.type === 'available'}
			<div class="flex items-center gap-3 py-3 border-b border-neutral-200 dark:border-neutral-700">
				<div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
					{minutesToTimeStr(slot.time)}
				</div>
				<div class="flex items-center gap-2">
					<Plus size={18} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-sm text-neutral-600 dark:text-neutral-400">Available</span>
				</div>
				<div class="flex-1"></div>
				<span class="text-xs text-neutral-500 dark:text-neutral-400">{formatDuration(slot.availableFor)}</span>
			</div>
		{:else if slot.type === 'break'}
			<div class="flex items-center gap-3 py-3 border-b border-neutral-200 dark:border-neutral-700">
				<div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
					{minutesToTimeStr(slot.time)}
				</div>
				<div class="flex items-center gap-2">
					<Coffee size={18} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-sm text-neutral-600 dark:text-neutral-400">Break</span>
				</div>
				<div class="flex-1"></div>
				<div class="flex items-center gap-2">
					<IconButton onclick={() => {}} aria-label="Edit break">
						<Pencil size={18} />
					</IconButton>
					<IconButton onclick={() => {}} aria-label="Delete break">
						<Trash2 size={18} />
					</IconButton>
				</div>
			</div>
		{:else if slot.type === 'appointment'}
			<a href="/{nickname}/appointments/{slot.apptData.id}" class="flex items-center gap-3 py-3 border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
				<div class="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-12">
					{minutesToTimeStr(slot.time)}
				</div>
				<Avatar src={slot.apptData.user.image} name={slot.apptData.user.name} size="sm" />
				<span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{slot.apptData.user.name}</span>
				<div class="flex-1"></div>
				<span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
					{slot.apptData.totalPrice} {slot.apptData.currency}
				</span>
			</a>
		{/if}
	{/each}
</div>
