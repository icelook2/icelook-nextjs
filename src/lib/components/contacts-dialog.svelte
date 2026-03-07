<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ArrowLeft, ChevronRight, Instagram, MapPin, Pencil, Phone } from 'lucide-svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import IconButton from '$lib/components/ui/icon-button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import type { Specialist } from '$lib/types/specialist';

	interface Props {
		open: boolean;
		specialist: Specialist;
		editable?: boolean;
	}

	let { open = $bindable(false), specialist, editable = false }: Props = $props();

	type ContactField = 'phoneNumber1' | 'phoneNumber2' | 'phoneNumber3' | 'instagram' | 'rawAddress';
	type Step = 'main' | ContactField;

	let step: Step = $state('main');
	let editing = $state(false);
	let draft = $state('');
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (!open) {
			step = 'main';
			editing = false;
			error = '';
		}
	});

	const fields: Record<ContactField, {
		label: string;
		icon: typeof Phone;
		placeholder: string;
		apiPath: string;
		inputType: string;
		hint?: string;
	}> = {
		phoneNumber1: {
			label: 'Phone 1',
			icon: Phone,
			placeholder: '+1234567890',
			apiPath: 'phone-number-1',
			inputType: 'tel',
			hint: 'International format: +1234567890'
		},
		phoneNumber2: {
			label: 'Phone 2',
			icon: Phone,
			placeholder: '+1234567890',
			apiPath: 'phone-number-2',
			inputType: 'tel',
			hint: 'International format: +1234567890'
		},
		phoneNumber3: {
			label: 'Phone 3',
			icon: Phone,
			placeholder: '+1234567890',
			apiPath: 'phone-number-3',
			inputType: 'tel',
			hint: 'International format: +1234567890'
		},
		instagram: {
			label: 'Instagram',
			icon: Instagram,
			placeholder: 'username',
			apiPath: 'instagram',
			inputType: 'text'
		},
		rawAddress: {
			label: 'Address',
			icon: MapPin,
			placeholder: 'Your address',
			apiPath: 'raw-address',
			inputType: 'text'
		}
	};

	const fieldKeys: ContactField[] = ['phoneNumber1', 'phoneNumber2', 'phoneNumber3', 'instagram', 'rawAddress'];

	const populatedFields = $derived(
		fieldKeys.filter((key) => specialist.contacts[key])
	);

	function goTo(field: ContactField) {
		draft = specialist.contacts[field] ?? '';
		error = '';
		step = field;
	}

	function goBack() {
		step = 'main';
		error = '';
	}

	function displayValue(field: ContactField): string {
		const val = specialist.contacts[field];
		if (!val) return 'Not set';
		if (field === 'instagram') return `@${val}`;
		return val;
	}

	async function save() {
		if (step === 'main') return;
		saving = true;
		error = '';
		try {
			const value = draft.trim() || null;
			const res = await fetch(`/specialists/${specialist.id}/contacts/${fields[step].apiPath}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value })
			});
			if (!res.ok) {
				try {
					const body = await res.json();
					error = body.message || 'Something went wrong';
				} catch {
					error = 'Something went wrong';
				}
				return;
			}
			await invalidateAll();
			goBack();
		} catch {
			error = 'Network error';
		} finally {
			saving = false;
		}
	}
</script>

<Dialog bind:open>
	{#snippet header()}
		{#if step === 'main'}
			<div class="flex w-full items-center justify-between">
				<h2 class="text-lg font-semibold">Contacts</h2>
				{#if editable}
					<IconButton
						size="sm"
						onclick={() => (editing = !editing)}
						class={editing ? 'bg-neutral-100 dark:bg-neutral-800' : ''}
					>
						<Pencil size={16} />
					</IconButton>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<IconButton onclick={goBack}>
					<ArrowLeft size={20} />
				</IconButton>
				<h2 class="text-lg font-semibold">{fields[step].label}</h2>
			</div>
		{/if}
	{/snippet}

	{#if step === 'main' && !editing}
		<!-- Read-only view: only populated fields -->
		{#if populatedFields.length > 0}
			<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
				{#each populatedFields as key (key)}
					{@const field = fields[key]}
					<div class="flex items-center gap-3 py-3">
						<field.icon size={16} class="shrink-0 text-neutral-400 dark:text-neutral-500" />
						<span class="text-sm text-neutral-900 dark:text-neutral-50">{displayValue(key)}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">No contacts added</p>
		{/if}
	{:else if step === 'main' && editing}
		<!-- Editable list: all fields with chevrons -->
		<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
			{#each fieldKeys as key (key)}
				{@const field = fields[key]}
				{@const value = displayValue(key)}
				<button
					class="flex w-full items-center justify-between py-3 text-left"
					onclick={() => goTo(key)}
				>
					<span class="flex items-center gap-3">
						<field.icon size={16} class="shrink-0 text-neutral-400 dark:text-neutral-500" />
						<span class="text-sm text-neutral-900 dark:text-neutral-50">{field.label}</span>
					</span>
					<span class="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
						<span class={specialist.contacts[key] ? '' : 'italic'}>{value}</span>
						<ChevronRight size={16} />
					</span>
				</button>
			{/each}
		</div>
	{:else}
		<!-- Edit step -->
		{@const field = fields[step as ContactField]}
		<FormField label={field.label} {error}>
			<Input bind:value={draft} type={field.inputType} placeholder={field.placeholder} />
			{#if field.hint}
				<p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">{field.hint}</p>
			{/if}
		</FormField>
	{/if}

	{#snippet footer()}
		{#if step === 'main'}
			<Button variant="outline" class="w-full" onclick={() => (open = false)}>Done</Button>
		{:else}
			<Button class="w-full" loading={saving} onclick={save}>Save</Button>
		{/if}
	{/snippet}
</Dialog>
