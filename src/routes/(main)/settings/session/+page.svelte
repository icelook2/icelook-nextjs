<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { Monitor, Smartphone } from 'lucide-svelte';

	interface Session {
		token: string;
		userAgent: string;
		ipAddress: string;
		createdAt: string;
	}

	let { data } = $props();
	let sessions = $state([...data.sessions]);
	let revokingToken = $state<string | null>(null);
	let signOutOpen = $state(false);
	let isSigningOut = $state(false);
	let revokeOpen = $state(false);
	let pendingRevokeToken = $state<string | null>(null);
	let revokeError = $state<string | null>(null);

	function parseDeviceInfo(userAgent: string): { device: string; icon: 'monitor' | 'smartphone' } {
		const ua = userAgent.toLowerCase();

		if (ua.includes('iphone')) {
			return { device: 'Safari on iPhone', icon: 'smartphone' };
		}
		if (ua.includes('ipad')) {
			return { device: 'Safari on iPad', icon: 'smartphone' };
		}
		if (ua.includes('android')) {
			return { device: 'Chrome on Android', icon: 'smartphone' };
		}
		if (ua.includes('macintosh') || ua.includes('mac os')) {
			return { device: 'Chrome on macOS', icon: 'monitor' };
		}
		if (ua.includes('windows')) {
			return { device: 'Chrome on Windows', icon: 'monitor' };
		}
		if (ua.includes('linux')) {
			return { device: 'Browser on Linux', icon: 'monitor' };
		}

		return { device: 'Unknown Device', icon: 'monitor' };
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	async function confirmRevoke() {
		if (!pendingRevokeToken) return;
		revokingToken = pendingRevokeToken;
		revokeOpen = false;
		revokeError = null;
		try {
			await authClient.revokeSession({ token: pendingRevokeToken });
			sessions = sessions.filter(s => s.token !== pendingRevokeToken);
		} catch (error) {
			console.error('Failed to revoke session:', error);
			revokeError = 'Failed to revoke session. Please try again.';
		} finally {
			revokingToken = null;
			pendingRevokeToken = null;
		}
	}

	async function handleSignOut() {
		isSigningOut = true;
		try {
			await authClient.signOut();
			await goto('/sign-in');
		} catch (error) {
			console.error('Sign out failed:', error);
			isSigningOut = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<BackButton />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Session</h1>
</header>

<div class="mt-8 px-3">
	{#if sessions.length === 0}
		<!-- Empty state -->
		<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
			<p class="text-sm text-neutral-600 dark:text-neutral-400">No active sessions found.</p>
		</div>
	{:else}
		<!-- Sessions list -->
		<p class="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Active Sessions</p>
		<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
			{#each sessions as session (session.token)}
				{@const { device, icon } = parseDeviceInfo(session.userAgent)}
				{@const isCurrent = session.token === data.currentToken}
				<div class="flex items-center gap-3 px-3 py-3">
					<div class="min-w-0 flex-1 flex items-center gap-3">
						{#if icon === 'monitor'}
							<Monitor size={20} class="text-neutral-500 dark:text-neutral-400 shrink-0" />
						{:else}
							<Smartphone size={20} class="text-neutral-500 dark:text-neutral-400 shrink-0" />
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{device}</p>
							<p class="text-xs text-neutral-500 dark:text-neutral-400">
								{session.ipAddress} · {formatDate(session.createdAt)}
							</p>
						</div>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						{#if isCurrent}
							<span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Current</span>
						{:else}
							<Button
								variant="ghost"
								size="sm"
								loading={revokingToken === session.token}
								onclick={() => { pendingRevokeToken = session.token; revokeOpen = true; }}
								class="!px-3"
							>
								Revoke
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if revokeError}
		<!-- Revoke error -->
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
			<p class="text-sm text-red-700 dark:text-red-400">{revokeError}</p>
		</div>
	{/if}
</div>

<!-- Sign Out Button -->
<div class="mt-8 px-3 pb-8">
	<Button variant="destructive" disabled={isSigningOut} onclick={() => (signOutOpen = true)}>
		Sign Out
	</Button>
</div>

<!-- Sign Out Confirmation Dialog -->
<Dialog bind:open={signOutOpen}>
	{#snippet header()}
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Sign Out</h2>
	{/snippet}

	<p class="text-neutral-600 dark:text-neutral-400">Are you sure you want to sign out?</p>

	{#snippet footer()}
		<div class="flex gap-3">
			<Button
				variant="outline"
				onclick={() => (signOutOpen = false)}
				disabled={isSigningOut}
				class="flex-1"
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				loading={isSigningOut}
				onclick={handleSignOut}
				class="flex-1"
			>
				Sign Out
			</Button>
		</div>
	{/snippet}
</Dialog>

<!-- Revoke Session Confirmation Dialog -->
<Dialog bind:open={revokeOpen}>
	{#snippet header()}
		<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Revoke Session</h2>
	{/snippet}

	<p class="text-neutral-600 dark:text-neutral-400">Are you sure you want to revoke this session?</p>

	{#snippet footer()}
		<div class="flex gap-3">
			<Button
				variant="outline"
				onclick={() => { revokeOpen = false; pendingRevokeToken = null; }}
				disabled={revokingToken !== null}
				class="flex-1"
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				loading={revokingToken !== null}
				onclick={confirmRevoke}
				class="flex-1"
			>
				Revoke
			</Button>
		</div>
	{/snippet}
</Dialog>
