<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ChevronRight } from 'lucide-svelte';

	const nickname = $derived(page.params.nickname);
</script>

<header class="flex items-center gap-3">
	<a
		href="/{nickname}"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Settings</h1>
</header>

<nav class="mt-8">
	<a
		href="/{nickname}/settings/clients"
		class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
	>
		<span class="text-neutral-900 dark:text-neutral-50">Clients</span>
		<ChevronRight size={20} class="text-neutral-400" />
	</a>
	<a
		href="/{nickname}/settings/blocked-clients"
		class="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
	>
		<span class="text-neutral-900 dark:text-neutral-50">Blocked clients</span>
		<ChevronRight size={20} class="text-neutral-400" />
	</a>
</nav>
