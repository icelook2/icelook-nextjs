<script lang="ts">
	import { z } from 'zod/v4/mini';
	import { getSignInContext } from '../context';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';

	const auth = getSignInContext();

	let email = $state('');
	let error = $state('');
	let loading = $state(false);

	const emailSchema = z.email('Enter a valid email address');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		const trimmed = email.trim();
		const result = emailSchema.safeParse(trimmed);
		if (!result.success) {
			error = result.error.issues[0].message;
			return;
		}

		loading = true;
		const { error: apiError } = await authClient.emailOtp.sendVerificationOtp({
			email: trimmed,
			type: 'sign-in'
		});
		loading = false;

		if (apiError) {
			error = apiError.message ?? 'Something went wrong. Try again.';
			return;
		}

		auth.email = trimmed;
		auth.step = 'verify-otp';
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<FormField label="Email" id="email" {error}>
		<Input
			id="email"
			name="email"
			type="email"
			placeholder="you@example.com"
			bind:value={email}
			autocomplete="email"
		/>
	</FormField>
	<Button type="submit" {loading}>Continue</Button>
</form>
