<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
	import Checkbox from '$lib/components/ui/checkbox.svelte';

	const preferences = $derived(page.data.preferences);

	let prefersMinimalConversation = $state(false);
	let saving = $state(false);

	$effect(() => {
		if (preferences) {
			prefersMinimalConversation = preferences.prefersMinimalConversation;
		}
	});

	async function toggleMinimalConversation() {
		const newValue = !prefersMinimalConversation;
		prefersMinimalConversation = newValue;
		saving = true;
		try {
			const res = await fetch('/me/preferences/minimal-conversation', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value: newValue })
			});
			if (!res.ok) {
				prefersMinimalConversation = !newValue;
			} else {
				await invalidateAll();
			}
		} catch {
			prefersMinimalConversation = !newValue;
		} finally {
			saving = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<a
		href="/settings"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Visit preferences</h1>
</header>

<div class="mt-6">
	<label class="flex items-start justify-between gap-4 py-3">
		<div>
			<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">Prefers minimal conversation</p>
			<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
				Let specialists know you prefer less small talk during visits.
			</p>
		</div>
		<Checkbox
			checked={prefersMinimalConversation}
			disabled={saving}
			onclick={toggleMinimalConversation}
		/>
	</label>
</div>
