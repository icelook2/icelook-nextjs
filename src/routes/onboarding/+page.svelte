<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import Input from '$lib/components/ui/input.svelte';

	let name = $state('');
	let submitting = $state(false);
	let error = $state('');

	async function submit() {
		submitting = true;
		error = '';
		try {
			const res = await fetch('/me/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (!res.ok) {
				const body: { message?: string } = await res.json().catch(() => ({}));
				error = body.message || 'Something went wrong';
				return;
			}
			goto('/');
		} catch {
			error = 'Network error';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="w-full max-w-sm px-4">
		<h1 class="text-2xl font-semibold mb-6">What's your name?</h1>
		<FormField label="Name" {error}>
			<Input bind:value={name} />
		</FormField>
		<Button onclick={submit} loading={submitting} class="mt-4 w-full">Continue</Button>
	</div>
</div>
