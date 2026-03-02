<script lang="ts">
	import { setSignInContext, type SignInContext } from '$lib/components/auth/sign-in/context';
	import EmailStep from '$lib/components/auth/sign-in/steps/EmailStep.svelte';
	import VerifyOtpStep from '$lib/components/auth/sign-in/steps/VerifyOtpStep.svelte';

	let auth = $state<SignInContext>({ step: 'email' });

	setSignInContext(auth);
</script>

{#if auth.step === 'email'}
	<EmailStep />
{:else}
	<VerifyOtpStep />
{/if}
