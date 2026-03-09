<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Briefcase, CheckCircle } from 'lucide-svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import IconButton from '$lib/components/ui/icon-button.svelte';
	import Input from '$lib/components/ui/input.svelte';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	type Step = 'intro' | 'name' | 'nickname';

	let step: Step = $state('intro');
	let name = $state('');
	let nickname = $state('');
	let loading = $state(false);
	let error = $state('');

	$effect(() => {
		if (!open) {
			step = 'intro';
			name = '';
			nickname = '';
			error = '';
			loading = false;
		}
	});

	function suggestNickname(fullName: string): string {
		return fullName
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '_')
			.replace(/^_+|_+$/g, '')
			.slice(0, 32);
	}

	const NICKNAME_RE = /^[a-z]+(_[a-z]+)*\d*$/;

	function validateNickname(v: string): string | null {
		if (v.length < 3) return 'At least 3 characters';
		if (v.length > 32) return 'At most 32 characters';
		if (!NICKNAME_RE.test(v)) return 'Lowercase letters and underscores only';
		return null;
	}

	const nicknameError = $derived(nickname.length > 0 ? (validateNickname(nickname) ?? '') : '');

	function goToName() {
		step = 'name';
		error = '';
	}

	function goToNickname() {
		nickname = suggestNickname(name);
		error = '';
		step = 'nickname';
	}

	async function createProfile() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/specialists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nickname, name })
			});
			if (!res.ok) {
				const text = await res.text();
				try {
					const json = JSON.parse(text);
					error = json.message ?? text;
				} catch {
					error = text || 'Something went wrong';
				}
				return;
			}
			open = false;
			await goto('/' + nickname, { invalidateAll: true });
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open>
	{#snippet header()}
		{#if step === 'intro'}
			<h2 class="text-lg font-semibold">Create Specialist Profile</h2>
		{:else if step === 'name'}
			<div class="flex items-center gap-2">
				<IconButton onclick={() => { step = 'intro'; error = ''; }}>
					<ArrowLeft size={20} />
				</IconButton>
				<h2 class="text-lg font-semibold">Your Name</h2>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<IconButton onclick={() => { step = 'name'; error = ''; }}>
					<ArrowLeft size={20} />
				</IconButton>
				<h2 class="text-lg font-semibold">Choose a Nickname</h2>
			</div>
		{/if}
	{/snippet}

	{#if step === 'intro'}
		<div class="flex flex-col items-center gap-6 py-4">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
				<Briefcase size={32} class="text-neutral-600 dark:text-neutral-300" />
			</div>
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<CheckCircle size={20} class="mt-0.5 shrink-0 text-green-500" />
					<p class="text-sm text-neutral-700 dark:text-neutral-300">Showcase your services and let clients book appointments</p>
				</div>
				<div class="flex items-start gap-3">
					<CheckCircle size={20} class="mt-0.5 shrink-0 text-green-500" />
					<p class="text-sm text-neutral-700 dark:text-neutral-300">Manage your schedule and availability in one place</p>
				</div>
				<div class="flex items-start gap-3">
					<CheckCircle size={20} class="mt-0.5 shrink-0 text-green-500" />
					<p class="text-sm text-neutral-700 dark:text-neutral-300">Get your own profile page and share it with clients</p>
				</div>
			</div>
		</div>
	{:else if step === 'name'}
		<FormField label="Full Name" error={error}>
			<Input bind:value={name} placeholder="e.g. John Doe" />
		</FormField>
	{:else}
		<FormField label="Nickname" error={error || nicknameError}>
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 dark:text-neutral-500">@</span>
				<Input bind:value={nickname} class="pl-7" placeholder="your_nickname" />
			</div>
		</FormField>
	{/if}

	{#snippet footer()}
		{#if step === 'intro'}
			<Button onclick={goToName} class="w-full">Get Started</Button>
		{:else if step === 'name'}
			<Button onclick={goToNickname} disabled={name.trim().length === 0} class="w-full">Next</Button>
		{:else}
			<Button onclick={createProfile} loading={loading} disabled={nicknameError.length > 0 || nickname.length === 0} class="w-full">Create Profile</Button>
		{/if}
	{/snippet}
</Dialog>
