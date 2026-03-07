<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSignInContext } from '../context';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button.svelte';
	import OtpInput from '$lib/components/ui/otp-input.svelte';

	const auth = getSignInContext();

	const OTP_LENGTH = 6;
	const MAX_ATTEMPTS = 3;
	const COUNTDOWN_SECONDS = 60;

	let otp = $state('');
	let error = $state('');
	let loading = $state(false);
	let attempts = $state(0);
	let countdown = $state(COUNTDOWN_SECONDS);
	let resending = $state(false);

	let exhausted = $derived(attempts >= MAX_ATTEMPTS);

	$effect(() => {
		if (countdown <= 0) return;
		const id = setInterval(() => {
			countdown--;
			if (countdown <= 0) clearInterval(id);
		}, 1000);
		return () => clearInterval(id);
	});

	async function verify() {
		if (otp.length !== OTP_LENGTH) return;

		loading = true;
		error = '';
		const { error: apiError } = await authClient.signIn.emailOtp({
			email: auth.email,
			otp
		});
		loading = false;

		if (apiError) {
			attempts++;
			if (attempts >= MAX_ATTEMPTS) {
				error = 'Code invalidated. Request a new one.';
			} else {
				error = apiError.message ?? 'Invalid code. Try again.';
			}
			return;
		}

		goto('/');
	}

	async function resend() {
		resending = true;
		error = '';
		await authClient.emailOtp.sendVerificationOtp({
			email: auth.email,
			type: 'sign-in'
		});
		resending = false;
		attempts = 0;
		countdown = COUNTDOWN_SECONDS;
		otp = '';
	}

	function goBack() {
		auth.step = 'email';
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-1">
		<p class="text-sm text-neutral-600 dark:text-neutral-400">
			We sent a code to <strong class="text-neutral-900 dark:text-neutral-50">{auth.email}</strong>
		</p>
	</div>

	<div class="flex flex-col gap-4">
		<OtpInput bind:value={otp} disabled={loading || exhausted} />

		{#if error}
			<p class="text-center text-sm text-red-600 dark:text-red-400">{error}</p>
		{/if}

		{#if loading}
			<p class="text-center text-sm text-neutral-500">Verifying...</p>
		{/if}
	</div>

	<div class="flex flex-col gap-2">
		{#if exhausted}
			<Button onclick={resend} loading={resending}>Request new code</Button>
		{:else}
			<Button onclick={verify} disabled={otp.length < OTP_LENGTH} {loading}>Verify</Button>

			<Button
				variant="ghost"
				onclick={resend}
				disabled={countdown > 0 || resending}
				loading={resending}
			>
				{#if countdown > 0}
					Resend code ({countdown}s)
				{:else}
					Resend code
				{/if}
			</Button>
		{/if}

		<Button variant="outline" onclick={goBack}>Back</Button>
	</div>
</div>
