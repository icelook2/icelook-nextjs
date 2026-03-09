<script lang="ts">
	import { page } from '$app/state';
	import { goto, preloadData } from '$app/navigation';
	import { addDays, subDays, format, parseISO, isValid, getDay, getDaysInMonth, addMonths, subMonths, isSameDay } from 'date-fns';
	import { toZonedTime } from 'date-fns-tz';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import IconButton from '$lib/components/ui/icon-button.svelte';
	import CreateWorkingDaysDialog from '$lib/components/create-working-days-dialog.svelte';
	import TimeslotList from '$lib/components/timeslot-list.svelte';
	import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';

	interface Props {
		data: {
			workingDay: any;
			date: string;
			timezone: string;
			specialistId: string;
			timeStep: number;
		};
	}

	let { data } = $props();

	let createDialogOpen = $state(false);

	function parseDateParam(): Date {
		const param = page.url.searchParams.get('date');
		if (param) {
			const parsed = parseISO(param);
			if (isValid(parsed)) return parsed;
		}
		return new Date();
	}

	let currentDate = $state(parseDateParam());
	let calendarOpen = $state(false);
	let calendarMonth = $state<Date>(new Date());

	let dateLabel = $derived(
		calendarOpen ? format(calendarMonth, 'MMMM') : format(currentDate, 'd MMMM')
	);

	function updateDate(newDate: Date) {
		currentDate = newDate;
		const formatted = format(newDate, 'yyyy-MM-dd');
		goto(`?date=${formatted}`, { replaceState: true });
	}

	function toggleCalendar() {
		calendarOpen = !calendarOpen;
		if (calendarOpen) calendarMonth = currentDate;
	}

	function prevAction() {
		if (calendarOpen) {
			calendarMonth = subMonths(calendarMonth, 1);
		} else {
			prevDay();
		}
	}

	function nextAction() {
		if (calendarOpen) {
			calendarMonth = addMonths(calendarMonth, 1);
		} else {
			nextDay();
		}
	}

	function prevDay() {
		updateDate(subDays(currentDate, 1));
	}

	function nextDay() {
		updateDate(addDays(currentDate, 1));
	}

	let calendarGrid = $derived.by(() => {
		const timezone = data.timezone;
		const year = calendarMonth.getFullYear();
		const month = calendarMonth.getMonth();
		const firstDayUTC = new Date(Date.UTC(year, month, 1));
		const firstDayZoned = toZonedTime(firstDayUTC, timezone);
		const dow = getDay(firstDayZoned);
		const offset = (dow + 6) % 7;
		const daysInMonth = getDaysInMonth(firstDayZoned);
		return Array.from({ length: 42 }, (_, i) => {
			const day = i - offset + 1;
			return day >= 1 && day <= daysInMonth ? day : null;
		});
	});

	function isSelectedDay(day: number): boolean {
		const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
		return isSameDay(cellDate, currentDate);
	}

	function selectDay(day: number) {
		const year = calendarMonth.getFullYear();
		const month = calendarMonth.getMonth();
		const selected = new Date(year, month, day);
		updateDate(selected);
	}

	$effect(() => {
		const param = page.url.searchParams.get('date');
		if (param) {
			const parsed = parseISO(param);
			if (isValid(parsed)) currentDate = parsed;
		}
	});

	$effect(() => {
		const base = `/${page.params.nickname}/schedule`;
		[-2, -1, 1, 2].forEach((offset) => {
			const d = addDays(currentDate, offset);
			preloadData(`${base}?date=${format(d, 'yyyy-MM-dd')}`);
		});
	});
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	<header class="flex items-center gap-3">
		<BackButton fallback="/{page.params.nickname}" />
		<h1 class="flex-1 text-xl font-semibold text-neutral-900 dark:text-neutral-50">Schedule</h1>
		<IconButton onclick={() => (createDialogOpen = true)} aria-label="Add working days">
			<Plus size={20} />
		</IconButton>
	</header>

	<div class="mt-6 flex items-center justify-between">
		<button
			onclick={toggleCalendar}
			class="text-lg font-semibold text-neutral-900 dark:text-neutral-50 rounded-full px-2 py-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
		>
			{dateLabel}
		</button>
		<div class="flex items-center gap-1">
			<IconButton onclick={prevAction} aria-label={calendarOpen ? 'Previous month' : 'Previous day'}>
				<ChevronLeft size={20} />
			</IconButton>
			<IconButton onclick={nextAction} aria-label={calendarOpen ? 'Next month' : 'Next day'}>
				<ChevronRight size={20} />
			</IconButton>
		</div>
	</div>

	{#if calendarOpen}
		<div class="mt-4 w-full">
			<div class="grid grid-cols-7 mb-1">
				{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as label, i (i)}
					<div class="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1">{label}</div>
				{/each}
			</div>

			<div class="grid grid-cols-7">
				{#each calendarGrid as day, i (i)}
					{#if day !== null}
						<button
							onclick={() => selectDay(day)}
							class="h-9 w-full text-sm rounded-full transition-colors {isSelectedDay(day)
								? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900'
								: 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
						>
							{day}
						</button>
					{:else}
						<div class="h-9"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-4 flex flex-col border-t border-neutral-200 pt-8 dark:border-neutral-700">
		{#if data.workingDay === null}
			<p class="text-sm text-neutral-500 dark:text-neutral-400 text-center">Day Off</p>
		{:else}
			<TimeslotList workingDay={data.workingDay} nickname={page.params.nickname} />
		{/if}
	</div>
</div>

<CreateWorkingDaysDialog bind:open={createDialogOpen} specialistId={data.specialistId} timeStep={data.timeStep} />
