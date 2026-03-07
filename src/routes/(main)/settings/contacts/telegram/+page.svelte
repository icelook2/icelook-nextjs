<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
	import Button from '$lib/components/ui/button.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import Input from '$lib/components/ui/input.svelte';

	const contacts = $derived(page.data.contacts);

	let draft = $state('');
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (contacts) {
			draft = contacts.telegram ?? '';
		}
	});

	async function save() {
		saving = true;
		error = '';
		try {
			const value = draft.trim() || null;
			const res = await fetch('/me/contacts/telegram', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value })
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
			goto('/settings/contacts');
		} catch {
			error = 'Network error';
		} finally {
			saving = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<a
		href="/settings/contacts"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Telegram</h1>
</header>

<div class="mt-6">
	<FormField label="Telegram" {error}>
		<Input bind:value={draft} type="text" placeholder="username" />
	</FormField>

	<Button onclick={save} loading={saving} class="mt-4 w-full">Save</Button>
</div>
