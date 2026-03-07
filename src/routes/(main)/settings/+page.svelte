<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ChevronRight } from 'lucide-svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';

	const user = $derived(page.data.user);
</script>

<header class="flex items-center gap-3">
	<a
		href="/"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Settings</h1>
</header>

<div class="mt-6 flex items-center gap-4 px-3 py-3">
	<Avatar src={user.image} name={user.name} size="lg" />
	<div class="flex-1">
		<p class="font-medium text-neutral-900 dark:text-neutral-50">{user.name}</p>
		<p class="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
	</div>
</div>

<nav class="mt-8 flex flex-col gap-6">
	<div>
		<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Account</h2>
		<div class="mt-2">
			<a
				href="/settings/profile"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="text-neutral-900 dark:text-neutral-50">Profile</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
			<a
				href="/settings/contacts"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="text-neutral-900 dark:text-neutral-50">Contacts</span>
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
				<span class="text-neutral-900 dark:text-neutral-50">Preferences</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
		</div>
	</div>

	<div>
		<h2 class="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">App</h2>
		<div class="mt-2">
			<a
				href="/settings/appearance"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="text-neutral-900 dark:text-neutral-50">Appearance</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
			<a
				href="/settings/language"
				class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
			>
				<span class="text-neutral-900 dark:text-neutral-50">Language</span>
				<ChevronRight size={20} class="text-neutral-400" />
			</a>
		</div>
	</div>
</nav>
