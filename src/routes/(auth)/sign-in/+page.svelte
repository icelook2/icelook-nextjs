<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import OtpInput from '$lib/components/ui/OtpInput.svelte';
	import IcelookLogo from '$lib/components/IcelookLogo.svelte';
	import { z } from 'zod/v4/mini';

	let step: 'email' | 'otp' = $state('email');
	let email = $state('');
	let emailError = $state('');
	let sendingOtp = $state(false);

	let otp = $state('');
	let otpError = $state('');
	let verifying = $state(false);
	let otpKey = $state(0);

	let cooldown = $state(0);
	let resending = $state(false);
	let canResend = $derived(cooldown === 0 && !resending);

	const emailSchema = z.email();

	function startCooldown() {
		cooldown = 60;

		const interval = setInterval(() => {
			cooldown--;

			if (cooldown <= 0) {
        clearInterval(interval);
      }
		}, 1_000);
	}

	async function sendOtp() {
		emailError = '';

		const result = emailSchema.safeParse(email.trim());

		if (!result.success) {
			emailError = 'Please enter a valid email';
			return;
		}

		sendingOtp = true;

		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email: email.trim(),
				type: 'sign-in'
			});

			if (error) {
				emailError = error.message ?? 'Failed to send code';
				return;
			}

			step = 'otp';
			startCooldown();
		} catch {
			emailError = 'Something went wrong. Please try again.';
		} finally {
			sendingOtp = false;
		}
	}

	async function verifyOtp(code: string) {
		otpError = '';
		verifying = true;

		try {
			const { error } = await authClient.signIn.emailOtp({
				email: email.trim(),
				otp: code
			});

			if (error) {
				otpError = error.message ?? 'Invalid code';
				otpKey++;
				return;
			}
			goto('/');
		} catch {
			otpError = 'Something went wrong. Please try again.';
			otpKey++;
		} finally {
			verifying = false;
		}
	}

	async function resendOtp() {
		otpError = '';
		resending = true;

		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email: email.trim(),
				type: 'sign-in'
			});

			if (error) {
				otpError = error.message ?? 'Failed to resend code';
				return;
			}

			otpKey++;
			startCooldown();
		} catch {
			otpError = 'Something went wrong. Please try again.';
		} finally {
			resending = false;
		}
	}

	function changeEmail() {
		step = 'email';
		otp = '';
		otpError = '';
		cooldown = 0;
	}
</script>

<svelte:head>
	<title>Sign In | Icelook</title>
</svelte:head>

<div class="w-full max-w-sm px-6 space-y-8">
	<div class="flex flex-col items-center gap-3">
		<IcelookLogo class="h-10" />
		<h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Sign in</h1>
	</div>

	{#if step === 'email'}
		<form onsubmit={(e) => { e.preventDefault(); sendOtp(); }} class="space-y-4">
			<FormField label="Email" error={emailError}>
				<Input
					type="email"
					placeholder="you@example.com"
					bind:value={email}
					autocomplete="email"
				/>
			</FormField>
			<Button type="submit" loading={sendingOtp} class="w-full">Continue</Button>
		</form>
	{:else}
		<div class="space-y-6">
			<p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
				We sent a code to <span class="font-medium text-neutral-900 dark:text-neutral-100">{email}</span>
			</p>

			<FormField error={otpError}>
				{#key otpKey}
					<OtpInput
						bind:value={otp}
						disabled={verifying}
						class="justify-center"
					/>
				{/key}
			</FormField>

			<Button
				onclick={() => verifyOtp(otp)}
				loading={verifying}
				disabled={otp.length < 6 || verifying}
				class="w-full"
			>
				Verify Code
			</Button>

			<div class="flex flex-col items-center gap-2 text-sm">
				<button
					type="button"
					onclick={resendOtp}
					disabled={!canResend}
					class="text-neutral-900 dark:text-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if resending}
						Sending...
					{:else if cooldown > 0}
						Resend code in {cooldown}s
					{:else}
						Resend code
					{/if}
				</button>
				<button
					type="button"
					onclick={changeEmail}
					class="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
				>
					Change email
				</button>
			</div>
		</div>
	{/if}
</div>
