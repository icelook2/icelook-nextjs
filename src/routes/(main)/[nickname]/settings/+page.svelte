<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Users, UserX } from 'lucide-svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	const nickname = $derived(page.params.nickname);
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/{nickname}" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Settings</h1>
</header>

<nav class="mt-8">
	<a
		href="/{nickname}/settings/clients"
		class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
	>
		<span class="flex items-center gap-3">
			<Users size={20} class="text-neutral-500 dark:text-neutral-400" />
			<span class="text-neutral-900 dark:text-neutral-50">Clients</span>
		</span>
		<ChevronRight size={20} class="text-neutral-400" />
	</a>
	<a
		href="/{nickname}/settings/blocked-clients"
		class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
	>
		<span class="flex items-center gap-3">
			<UserX size={20} class="text-neutral-500 dark:text-neutral-400" />
			<span class="text-neutral-900 dark:text-neutral-50">Blocked clients</span>
		</span>
		<ChevronRight size={20} class="text-neutral-400" />
	</a>
</nav>
