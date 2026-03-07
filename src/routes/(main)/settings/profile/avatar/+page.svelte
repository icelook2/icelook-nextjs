<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, Camera } from 'lucide-svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import Button from '$lib/components/ui/button.svelte';

	const profile = $derived(page.data.profile);

	let fileInput: HTMLInputElement = $state(null!);
	let selectedFile: File | null = $state(null);
	let previewUrl: string | null = $state(null);
	let uploading = $state(false);
	let error = $state('');

	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
	const MAX_SIZE = 2 * 1024 * 1024; // 2MB

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

	async function save() {
		if (!selectedFile) return;
		uploading = true;
		error = '';
		try {
			const formData = new FormData();
			formData.append('avatar', selectedFile);
			const res = await fetch('/me/avatar', {
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
						const body: { message?: string } = await res.json();
						error = body.message || 'Something went wrong';
					} catch {
						error = 'Something went wrong';
					}
				}
				return;
			}
			await invalidateAll();
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			goto('/settings/profile');
		} catch {
			error = 'Network error';
		} finally {
			uploading = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<a
		href="/settings/profile"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Avatar</h1>
</header>

<div class="mt-6 flex flex-col items-center gap-4">
	<button
		type="button"
		class="group relative cursor-pointer"
		onclick={() => fileInput.click()}
	>
		{#if previewUrl}
			<img
				src={previewUrl}
				alt="Preview"
				class="h-24 w-24 rounded-full object-cover"
			/>
		{:else}
			<Avatar src={profile?.imageUrl} name={profile?.name} size="xl" />
		{/if}
		<div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
			<Camera size={24} class="text-white opacity-0 transition-opacity group-hover:opacity-100" />
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
	<Button onclick={save} loading={uploading} disabled={!selectedFile} class="w-full">Save</Button>
</div>
