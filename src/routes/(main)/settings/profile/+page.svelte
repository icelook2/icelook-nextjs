<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';

	const profile = $derived(page.data.profile);
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/settings" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Profile</h1>
</header>

<div class="mt-6 divide-y divide-neutral-200 dark:divide-neutral-700">
	<a
		href="/settings/profile/avatar"
		class="flex w-full items-center justify-between py-3 text-left"
	>
		<span class="text-sm text-neutral-900 dark:text-neutral-50">Avatar</span>
		<span class="flex items-center gap-1">
			<Avatar src={profile?.imageUrl} name={profile?.name} size="sm" />
			<ChevronRight size={16} class="text-neutral-500 dark:text-neutral-400" />
		</span>
	</a>

	<a
		href="/settings/profile/name"
		class="flex w-full items-center justify-between py-3 text-left"
	>
		<span class="text-sm text-neutral-900 dark:text-neutral-50">Name</span>
		<span class="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
			{profile?.name}
			<ChevronRight size={16} />
		</span>
	</a>

	<div class="flex w-full items-center justify-between py-3">
		<span class="text-sm text-neutral-900 dark:text-neutral-50">Email</span>
		<span class="text-sm text-neutral-500 dark:text-neutral-400">
			{profile?.email}
		</span>
	</div>
</div>
