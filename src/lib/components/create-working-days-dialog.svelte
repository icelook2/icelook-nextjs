<script lang="ts">
	import { format, parseISO, getDaysInMonth, getDay, addMonths, subMonths, isBefore, startOfDay, isSameMonth, getYear, isSameDay } from 'date-fns';
	import { toZonedTime } from 'date-fns-tz';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import Dialog from './ui/dialog.svelte';
	import Select from './ui/select.svelte';
	import IconButton from './ui/icon-button.svelte';
	import { ChevronLeft, ChevronRight, X, Loader2, Plus, Trash2, ArrowLeft, Undo } from 'lucide-svelte';

	interface TimeConfig {
		startTime: number;
		endTime: number;
		breaks: Array<{ startTime: number; endTime: number }>;
	}

	interface Props {
		open?: boolean;
		specialistId: string;
		timeStep: number;
	}

	let { open = $bindable(false), specialistId, timeStep }: Props = $props();

	let step = $state<'calendar' | 'time' | 'confirm'>('calendar');
	let selectedDates = $state<string[]>([]);
	let calendarMonth = $state(new Date());
	let weekdayConfig = $state<TimeConfig>({
		startTime: 9 * 60,
		endTime: 18 * 60,
		breaks: []
	});
	let weekendConfig = $state<TimeConfig>({
		startTime: 9 * 60,
		endTime: 18 * 60,
		breaks: []
	});
	let loading = $state(false);

	function buildTimeOptions() {
		return Array.from({ length: 48 }, (_, i) => {
			const mins = i * 30;
			const h = String(Math.floor(mins / 60)).padStart(2, '0');
			const m = String(mins % 60).padStart(2, '0');
			return { value: mins, label: `${h}:${m}` };
		});
	}

	const timeOptions = buildTimeOptions();

	function reset() {
		step = 'calendar';
		selectedDates = [];
		calendarMonth = new Date();
		weekdayConfig = { startTime: 9 * 60, endTime: 18 * 60, breaks: [] };
		weekendConfig = { startTime: 9 * 60, endTime: 18 * 60, breaks: [] };
		loading = false;
	}

	$effect(() => {
		if (!open) {
			reset();
		}
	});

	$effect(() => {
		const start = weekdayConfig.startTime;
		const end = weekdayConfig.endTime;
		untrack(() => {
			weekdayConfig.breaks = weekdayConfig.breaks
				.map(b => ({
					startTime: Math.max(b.startTime, start),
					endTime: Math.min(b.endTime, end)
				}))
				.filter(b => b.startTime < b.endTime);
		});
	});

	$effect(() => {
		const start = weekendConfig.startTime;
		const end = weekendConfig.endTime;
		untrack(() => {
			weekendConfig.breaks = weekendConfig.breaks
				.map(b => ({
					startTime: Math.max(b.startTime, start),
					endTime: Math.min(b.endTime, end)
				}))
				.filter(b => b.startTime < b.endTime);
		});
	});

	// Calendar step derived state
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

	const isCurrentMonth = $derived(isSameMonth(calendarMonth, new Date()));

	function isPastDay(day: number): boolean {
		const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
		const today = startOfDay(new Date());
		return isBefore(cellDate, today);
	}

	function isSelectedDate(day: number): boolean {
		const dateStr = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd');
		return selectedDates.includes(dateStr);
	}

	function isToday(day: number): boolean {
		const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
		return isSameDay(cellDate, new Date());
	}

	function toggleDate(day: number) {
		if (isPastDay(day)) return;
		const dateStr = format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day), 'yyyy-MM-dd');
		if (selectedDates.includes(dateStr)) {
			selectedDates = selectedDates.filter((d) => d !== dateStr);
		} else {
			selectedDates = [...selectedDates, dateStr];
		}
	}

	function getDayOfWeek(dateStr: string): number {
		const date = parseISO(dateStr);
		return getDay(date);
	}

	const hasWeekdays = $derived(selectedDates.some((d) => {
		const dow = getDayOfWeek(d);
		return dow !== 0 && dow !== 6; // Monday-Friday
	}));

	const hasWeekends = $derived(selectedDates.some((d) => {
		const dow = getDayOfWeek(d);
		return dow === 0 || dow === 6; // Saturday-Sunday
	}));

	function canAddBreak(config: TimeConfig): boolean {
		if (config.breaks.length >= 3) return false;
		const nextStart = config.breaks.length > 0
			? config.breaks[config.breaks.length - 1].endTime
			: config.startTime;
		return nextStart + timeStep <= config.endTime;
	}

	function addBreak(config: TimeConfig) {
		if (!canAddBreak(config)) return;
		const lastEnd = config.breaks.length > 0
			? config.breaks[config.breaks.length - 1].endTime
			: config.startTime;
		const newStart = lastEnd;
		const newEnd = Math.min(newStart + timeStep, config.endTime);
		config.breaks = [...config.breaks, { startTime: newStart, endTime: newEnd }];
	}

	function removeBreak(config: TimeConfig, index: number) {
		config.breaks = config.breaks.filter((_, i) => i !== index);
	}

	function startOptions(endTime: number) {
		return timeOptions.map(o => ({ ...o, disabled: o.value >= endTime }));
	}

	function endOptions(startTime: number) {
		return timeOptions.map(o => ({ ...o, disabled: o.value <= startTime }));
	}

	function breakStartOptions(config: TimeConfig, breakEndTime: number) {
		return timeOptions.map(o => ({
			...o,
			disabled: o.value < config.startTime || o.value >= config.endTime || o.value >= breakEndTime
		}));
	}

	function breakEndOptions(config: TimeConfig, breakStartTime: number) {
		return timeOptions.map(o => ({
			...o,
			disabled: o.value <= breakStartTime || o.value > config.endTime
		}));
	}

	const sortedDates = $derived([...selectedDates].sort());

	const payload = $derived.by(() => {
		return sortedDates.map((dateStr) => {
			const dow = getDayOfWeek(dateStr);
			const isWeekend = dow === 0 || dow === 6;
			const config = isWeekend ? weekendConfig : weekdayConfig;

			return {
				date: dateStr,
				startTime: config.startTime,
				endTime: config.endTime,
				breaks: config.breaks.map((b) => ({
					startTime: b.startTime,
					endTime: b.endTime
				}))
			};
		});
	});

	const groupedPayload = $derived.by(() => {
		const groups: Array<{ month: string; items: typeof payload }> = [];
		for (const item of payload) {
			const month = format(parseISO(item.date), 'MMMM');
			const last = groups[groups.length - 1];
			if (last && last.month === month) {
				last.items.push(item);
			} else {
				groups.push({ month, items: [item] });
			}
		}
		return groups;
	});

	function formatMinutesToTime(mins: number): string {
		const h = String(Math.floor(mins / 60)).padStart(2, '0');
		const m = String(mins % 60).padStart(2, '0');
		return `${h}:${m}`;
	}

	function formatTimeRange(startMins: number, endMins: number): string {
		return `${formatMinutesToTime(startMins)} – ${formatMinutesToTime(endMins)}`;
	}

	async function handleCreate() {
		loading = true;
		try {
			const apiUrl = PUBLIC_API_URL || '';
			const url = `${apiUrl}/specialists/${specialistId}/schedule`;

			console.log('🔵 Request URL:', url);
			console.log('📦 Payload:', JSON.stringify({ workingDays: payload }, null, 2));

			const res = await fetch(url, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workingDays: payload })
			});

			console.log('📊 Response Status:', res.status);

			const responseText = await res.text();
			console.log('📄 Response Body:', responseText);

			if (!res.ok) {
				const errorMsg = responseText ? `${res.status}: ${responseText}` : `${res.status}: Failed to create working days`;
				throw new Error(errorMsg);
			}

			open = false;
			await invalidateAll();
		} catch (err) {
			console.error('❌ Error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open>
	{#snippet header()}
		<div class="flex items-center gap-3">
			<!-- Back button -->
			{#if step !== 'calendar'}
				<IconButton
					onclick={() => {
						if (step === 'time') step = 'calendar';
						else if (step === 'confirm') step = 'time';
					}}
					aria-label="Go back"
				>
					<ArrowLeft size={20} />
				</IconButton>
			{/if}

			<!-- Title -->
			<h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
				{step === 'calendar' ? 'Select Days' : step === 'time' ? 'Set Hours' : 'Confirm'}
			</h2>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Close button -->
			<IconButton onclick={() => (open = false)} aria-label="Close">
				<X size={20} />
			</IconButton>
		</div>
	{/snippet}

	<!-- Calendar Step -->
	{#if step === 'calendar'}
		<div class="space-y-4">
			<!-- Month Navigation -->
			<div class="flex items-center justify-between">
				<h3 class="font-medium text-neutral-900 dark:text-neutral-50">
					{getYear(calendarMonth) === getYear(new Date())
						? format(calendarMonth, 'MMMM')
						: format(calendarMonth, 'MMMM yyyy')}
				</h3>
				<div class="flex gap-1">
					{#if !isCurrentMonth}
						<IconButton
							onclick={() => (calendarMonth = new Date())}
							aria-label="Return to current month"
						>
							<Undo size={20} />
						</IconButton>
					{/if}
					<IconButton
						onclick={() => (calendarMonth = subMonths(calendarMonth, 1))}
						aria-label="Previous month"
					>
						<ChevronLeft size={20} />
					</IconButton>
					<IconButton
						onclick={() => (calendarMonth = addMonths(calendarMonth, 1))}
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

				<div class="grid grid-cols-7 gap-1">
					{#each calendarGrid as day, i (i)}
						{#if day !== null}
							<button
								onclick={() => toggleDate(day)}
								disabled={isPastDay(day)}
								class="h-8 rounded-full text-sm font-medium transition-colors {isPastDay(day)
									? 'line-through opacity-40 cursor-not-allowed text-neutral-500 dark:text-neutral-400'
									: isSelectedDate(day)
										? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900 ' + (isToday(day) ? 'ring-2 ring-neutral-900 dark:ring-neutral-50' : '')
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
			</div>
		</div>
	{/if}

	<!-- Time Step -->
	{#if step === 'time'}
		<div class="space-y-6">
			{#if hasWeekdays}
				<div class="space-y-3 {hasWeekends ? 'border-b border-neutral-200 pb-6 dark:border-neutral-700' : ''}">
					<h3 class="font-medium text-neutral-900 dark:text-neutral-50">Weekday Hours</h3>
					<div class="space-y-2">
						<div class="flex gap-2">
							<Select options={startOptions(weekdayConfig.endTime)} bind:value={weekdayConfig.startTime} class="flex-1" />
							<Select options={endOptions(weekdayConfig.startTime)} bind:value={weekdayConfig.endTime} class="flex-1" />
							<div class="w-[34px] shrink-0"></div>
						</div>

						{#if weekdayConfig.breaks.length > 0}
							<h3 class="font-medium text-neutral-900 dark:text-neutral-50">Breaks</h3>
						{/if}
						{#each weekdayConfig.breaks as breakItem, i (i)}
							<div class="flex gap-2">
								<Select options={breakStartOptions(weekdayConfig, breakItem.endTime)} bind:value={breakItem.startTime} class="flex-1" />
								<Select options={breakEndOptions(weekdayConfig, breakItem.startTime)} bind:value={breakItem.endTime} class="flex-1" />
								<button
									onclick={() => removeBreak(weekdayConfig, i)}
									class="rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
									aria-label="Remove break"
								>
									<Trash2 size={18} class="text-neutral-500 dark:text-neutral-400" />
								</button>
							</div>
						{/each}

						{#if canAddBreak(weekdayConfig)}
							<button
								onclick={() => addBreak(weekdayConfig)}
								class="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
							>
								<Plus size={16} />
								Add break
							</button>
						{/if}
					</div>
				</div>
			{/if}

			{#if hasWeekends}
				<div class="space-y-3">
					<h3 class="font-medium text-neutral-900 dark:text-neutral-50">Weekend Hours</h3>
					<div class="space-y-2">
						<div class="flex gap-2">
							<Select options={startOptions(weekendConfig.endTime)} bind:value={weekendConfig.startTime} class="flex-1" />
							<Select options={endOptions(weekendConfig.startTime)} bind:value={weekendConfig.endTime} class="flex-1" />
							<div class="w-[34px] shrink-0"></div>
						</div>

						{#if weekendConfig.breaks.length > 0}
							<h3 class="font-medium text-neutral-900 dark:text-neutral-50">Breaks</h3>
						{/if}
						{#each weekendConfig.breaks as breakItem, i (i)}
							<div class="flex gap-2">
								<Select options={breakStartOptions(weekendConfig, breakItem.endTime)} bind:value={breakItem.startTime} class="flex-1" />
								<Select options={breakEndOptions(weekendConfig, breakItem.startTime)} bind:value={breakItem.endTime} class="flex-1" />
								<button
									onclick={() => removeBreak(weekendConfig, i)}
									class="rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
									aria-label="Remove break"
								>
									<Trash2 size={18} class="text-neutral-500 dark:text-neutral-400" />
								</button>
							</div>
						{/each}

						{#if canAddBreak(weekendConfig)}
							<button
								onclick={() => addBreak(weekendConfig)}
								class="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
							>
								<Plus size={16} />
								Add break
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Confirm Step -->
	{#if step === 'confirm'}
		<div class="space-y-4">
			{#each groupedPayload as group (group.month)}
				<div>
					<h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{group.month}</h3>
					<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
						{#each group.items as item (item.date)}
							<div class="py-3">
								<div class="flex items-center justify-between">
									<span class="text-sm">
										<span class="font-medium text-neutral-900 dark:text-neutral-50">{format(parseISO(item.date), 'MMMM d')}</span>
										<span class="italic text-neutral-400 dark:text-neutral-500">{format(parseISO(item.date), ' EEEE')}</span>
									</span>
									<span class="text-sm text-neutral-600 dark:text-neutral-400">
										{formatMinutesToTime(item.startTime)} – {formatMinutesToTime(item.endTime)}
									</span>
								</div>

								{#if item.breaks && item.breaks.length > 0}
									<div class="mt-2 space-y-1">
										{#each item.breaks as brk, i (i)}
											<div class="flex items-center justify-between">
												<span class="text-xs text-neutral-500 dark:text-neutral-400">Break {i + 1}</span>
												<span class="text-xs text-neutral-500 dark:text-neutral-400">
													{formatMinutesToTime(brk.startTime)} – {formatMinutesToTime(brk.endTime)}
												</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex gap-3 justify-end">
			{#if step === 'calendar'}
				<button
					onclick={() => (step = 'time')}
					disabled={selectedDates.length === 0}
					class="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:opacity-50"
				>
					Next
				</button>
			{:else if step === 'time'}
				<button
					onclick={() => (step = 'confirm')}
					class="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
				>
					Next
				</button>
			{:else if step === 'confirm'}
				<button
					onclick={handleCreate}
					disabled={loading}
					class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
				>
					{#if loading}
						<Loader2 size={16} class="animate-spin" />
					{/if}
					Create
				</button>
			{/if}
		</div>
	{/snippet}
</Dialog>
