<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ArrowLeft, Camera, ChevronRight } from 'lucide-svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import IconButton from '$lib/components/ui/icon-button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Textarea from '$lib/components/ui/textarea.svelte';
	import type { Specialist } from '$lib/types/specialist';

	interface Props {
		open?: boolean;
		specialist: Specialist;
	}

	let { open = $bindable(false), specialist }: Props = $props();

	type EditField = 'name' | 'nickname' | 'bio';
	type Step = 'main' | EditField | 'avatar';

	let step: Step = $state('main');
	let draft = $state('');
	let saving = $state(false);
	let error = $state('');

	let fileInput: HTMLInputElement = $state(null!);
	let selectedFile: File | null = $state(null);
	let previewUrl: string | null = $state(null);
	let uploading = $state(false);

	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
	const MAX_SIZE = 2 * 1024 * 1024; // 2MB

	const COOLDOWN_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

	let nicknameCooldown = $derived.by(() => {
		if (!specialist.nicknameChangedAt) return { locked: false, label: '' };
		const elapsed = Date.now() - new Date(specialist.nicknameChangedAt).getTime();
		const remaining = COOLDOWN_MS - elapsed;
		if (remaining <= 0) return { locked: false, label: '' };
		const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
		const months = Math.floor(days / 30);
		const d = days % 30;
		const label = months > 0 ? `in ${months}mo ${d}d` : `in ${d}d`;
		return { locked: true, label };
	});

	$effect(() => {
		if (!open) {
			step = 'main';
			resetAvatarState();
		}
	});

	function resetAvatarState() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		selectedFile = null;
		previewUrl = null;
		uploading = false;
	}

	function goTo(field: EditField) {
		draft = specialist[field] ?? '';
		error = '';
		step = field;
	}

	function goBack() {
		step = 'main';
		error = '';
	}

	const fieldLabels: Record<EditField, string> = {
		name: 'Name',
		nickname: 'Nickname',
		bio: 'Bio'
	};

	async function save(field: EditField) {
		saving = true;
		error = '';
		try {
			const res = await fetch(`/specialists/${specialist.id}/${field}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ [field]: draft })
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
			if (field === 'nickname') {
				await goto(`/${draft}`, { invalidateAll: true });
			} else {
				await invalidateAll();
			}
			goBack();
		} catch {
			error = 'Network error';
		} finally {
			saving = false;
		}
	}

	const saveName = () => save('name');
	const saveNickname = () => save('nickname');
	const saveBio = () => save('bio');

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		error = '';

		if (!ALLOWED_TYPES.includes(file.type)) {
			error = 'Only JPEG, PNG, and WebP images are allowed';
			return;
		}

		if (file.size > MAX_SIZE) {
			error = 'Image must be under 2MB';
			return;
		}

		if (previewUrl) URL.revokeObjectURL(previewUrl);
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	async function saveAvatar() {
		if (!selectedFile) return;
		uploading = true;
		error = '';
		try {
			const formData = new FormData();
			formData.append('avatar', selectedFile);
			const res = await fetch(`/specialists/${specialist.id}/avatar`, {
				method: 'PUT',
				body: formData
			});
			if (!res.ok) {
				if (res.status === 413) {
					error = 'Image is too large. Maximum size is 2MB';
				} else if (res.status === 422) {
					error = 'Invalid image format';
				} else {
					try {
						const body = await res.json();
						error = body.message || 'Something went wrong';
					} catch {
						error = 'Something went wrong';
					}
				}
				return;
			}
			await invalidateAll();
			resetAvatarState();
			goBack();
		} catch {
			error = 'Network error';
		} finally {
			uploading = false;
		}
	}
</script>

<Dialog bind:open>
	{#snippet header()}
		{#if step === 'main'}
			<h2 class="text-lg font-semibold">Edit Profile</h2>
		{:else if step === 'avatar'}
			<div class="flex items-center gap-2">
				<IconButton
					onclick={() => {
						resetAvatarState();
						goBack();
					}}
				>
					<ArrowLeft size={20} />
				</IconButton>
				<h2 class="text-lg font-semibold">Avatar</h2>
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<IconButton onclick={goBack}>
					<ArrowLeft size={20} />
				</IconButton>
				<h2 class="text-lg font-semibold">{fieldLabels[step]}</h2>
			</div>
		{/if}
	{/snippet}

	{#if step === 'main'}
		<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
			<!-- Avatar -->
			<button
				class="flex w-full items-center justify-between py-3 text-left"
				onclick={() => {
					error = '';
					step = 'avatar';
				}}
			>
				<span class="text-sm text-neutral-900 dark:text-neutral-50">Avatar</span>
				<span class="flex items-center gap-1">
					<Avatar src={specialist.avatarUrl} name={specialist.name} size="sm" />
					<ChevronRight size={16} class="text-neutral-500 dark:text-neutral-400" />
				</span>
			</button>

			<!-- Name -->
			<button
				class="flex w-full items-center justify-between py-3 text-left"
				onclick={() => goTo('name')}
			>
				<span class="text-sm text-neutral-900 dark:text-neutral-50">Name</span>
				<span class="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
					{specialist.name}
					<ChevronRight size={16} />
				</span>
			</button>

			<!-- Nickname -->
			<button
				class="flex w-full items-center justify-between py-3 text-left"
				onclick={() => goTo('nickname')}
			>
				<span class="text-sm text-neutral-900 dark:text-neutral-50">Nickname</span>
				<span class="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
					@{specialist.nickname}
					<ChevronRight size={16} />
				</span>
			</button>

			<!-- Bio -->
			<button
				class="flex w-full items-center justify-between py-3 text-left"
				onclick={() => goTo('bio')}
			>
				<span class="text-sm text-neutral-900 dark:text-neutral-50">Bio</span>
				<span
					class="flex max-w-[60%] items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400"
				>
					<span class="truncate">
						{specialist.bio || 'Add a bio'}
					</span>
					<ChevronRight size={16} class="shrink-0" />
				</span>
			</button>
		</div>
	{:else if step === 'avatar'}
		<div class="flex flex-col items-center gap-4">
			<button type="button" class="group relative cursor-pointer" onclick={() => fileInput.click()}>
				{#if previewUrl}
					<img src={previewUrl} alt="Preview" class="h-24 w-24 rounded-full object-cover" />
				{:else}
					<Avatar src={specialist.avatarUrl} name={specialist.name} size="xl" />
				{/if}
				<div
					class="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40"
				>
					<Camera
						size={24}
						class="text-white opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
			</button>
			<p class="text-xs text-neutral-500 dark:text-neutral-400">Click to choose a photo</p>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				class="hidden"
				onchange={handleFileSelect}
			/>
			{#if error}
				<p class="text-sm text-red-500">{error}</p>
			{/if}
		</div>
	{:else if step === 'bio'}
		<FormField label={fieldLabels[step]} {error}>
			<Textarea
				bind:value={draft}
				rows={4}
				maxlength={128}
				placeholder="Tell people about yourself..."
			/>
			<p class="mt-1.5 text-right text-xs text-neutral-400 dark:text-neutral-500">
				{draft.length}/128
			</p>
		</FormField>
	{:else if step === 'nickname'}
		<FormField label={fieldLabels[step]} {error}>
			<Input bind:value={draft} disabled={nicknameCooldown.locked} />
			{#if nicknameCooldown.locked}
				<p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
					You changed your nickname recently. You can change it again {nicknameCooldown.label}.
				</p>
			{:else}
				<p class="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
					Nickname can be changed once every 6 months. Your previous nickname stays reserved for 6
					months.
				</p>
			{/if}
		</FormField>
	{:else}
		<FormField label={fieldLabels[step]} {error}>
			<Input bind:value={draft} />
		</FormField>
	{/if}

	{#snippet footer()}
		{#if step === 'main'}
			<Button variant="outline" onclick={() => (open = false)} class="w-full">Done</Button>
		{:else if step === 'avatar'}
			<Button onclick={saveAvatar} loading={uploading} disabled={!selectedFile} class="w-full"
				>Save</Button
			>
		{:else if step === 'name'}
			<Button onclick={saveName} loading={saving} class="w-full">Save</Button>
		{:else if step === 'nickname'}
			<Button
				onclick={saveNickname}
				loading={saving}
				disabled={nicknameCooldown.locked}
				class="w-full">Save</Button
			>
		{:else if step === 'bio'}
			<Button onclick={saveBio} loading={saving} class="w-full">Save</Button>
		{/if}
	{/snippet}
</Dialog>
