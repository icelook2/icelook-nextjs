<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';

	const nickname = $derived(page.params.nickname);
</script>

<header class="flex items-center gap-3">
	<a
		href="/{nickname}/settings"
		class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
	>
		<ArrowLeft size={20} />
	</a>
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Clients</h1>
</header>
