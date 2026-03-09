<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import Input from '$lib/components/ui/input.svelte';

	const profile = $derived(page.data.profile);

	let draft = $state('');
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (profile) {
			draft = profile.name ?? '';
		}
	});

	async function save() {
		saving = true;
		error = '';
		try {
			const res = await fetch('/me/name', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: draft })
			});
			if (!res.ok) {
				try {
					const body: { message?: string } = await res.json();
					error = body.message || 'Something went wrong';
				} catch {
					error = 'Something went wrong';
				}
				return;
			}
			await invalidateAll();
			goto('/settings/profile');
		} catch {
			error = 'Network error';
		} finally {
			saving = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/settings/profile" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Name</h1>
</header>

<div class="mt-6">
	<FormField label="Name" {error}>
		<Input bind:value={draft} />
	</FormField>

	<Button onclick={save} loading={saving} class="mt-4 w-full">Save</Button>
</div>
