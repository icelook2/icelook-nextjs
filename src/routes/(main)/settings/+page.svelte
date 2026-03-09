<script lang="ts">
	import { page } from '$app/state';
	import { Briefcase, ChevronRight, User, BookUser, SlidersHorizontal, Palette, Globe, LogOut } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import CreateSpecialistProfileDialog from '$lib/components/create-specialist-profile-dialog.svelte';
	import type { MySpecialist } from '$lib/types/specialist';

	const user = $derived(page.data.user);
	const specialists = $derived(page.data.specialists as MySpecialist[]);
	const hasSpecialists = $derived(specialists.length > 0);
	let dialogOpen = $state(false);
</script>

<header class="flex items-center gap-3">
	<BackButton />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Settings</h1>
</header>

<div class="mt-6 flex items-center gap-4 px-3 py-3">
	<Avatar src={user.image} name={user.name} size="lg" />
	<div class="flex-1">
		<p class="font-medium text-neutral-900 dark:text-neutral-50">{user.name}</p>
		<p class="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
	</div>
</div>

{#if !hasSpecialists}
	<div class="mt-6 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 dark:from-neutral-700 dark:to-neutral-800">
		<div class="flex items-start gap-4">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
				<Briefcase size={20} class="text-white" />
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-white">Become a Specialist</h3>
				<p class="mt-1 text-sm text-neutral-300">Create a profile to offer your services and let clients book appointments.</p>
				<Button variant="secondary" size="sm" class="mt-4" onclick={() => (dialogOpen = true)}>Create Specialist Profile</Button>
			</div>
		</div>
	</div>
{/if}

<CreateSpecialistProfileDialog bind:open={dialogOpen} />

<nav class="mt-8 flex flex-col gap-6">
	<div>
		<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Account</h2>
		<div class="mt-2">
			<a
				href="/settings/profile"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<User size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Profile</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
			<a
				href="/settings/contacts"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<BookUser size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Contacts</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
			<a
				href="/settings/session"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<LogOut size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Session</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
		</div>
	</div>

	<div>
		<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Visit Preferences</h2>
		<div class="mt-2">
			<a
				href="/settings/preferences"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<SlidersHorizontal size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Preferences</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
		</div>
	</div>

	{#if hasSpecialists}
		<div>
			<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Specialist</h2>
			<div class="mt-2">
				<a
					href="/settings/specialist-profiles"
					class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
				>
					<span class="flex items-center gap-3">
						<Briefcase size={20} class="text-neutral-500 dark:text-neutral-400" />
						<span class="text-neutral-900 dark:text-neutral-50">Specialist Profiles</span>
					</span>
					<ChevronRight size={20} class="text-neutral-400" />
				</a>
			</div>
		</div>
	{/if}

	<div>
		<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">App</h2>
		<div class="mt-2">
			<a
				href="/settings/appearance"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<Palette size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Appearance</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
			<a
				href="/settings/language"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-3">
					<Globe size={20} class="text-neutral-500 dark:text-neutral-400" />
					<span class="text-neutral-900 dark:text-neutral-50">Language</span>
				</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
		</div>
	</div>
</nav>
