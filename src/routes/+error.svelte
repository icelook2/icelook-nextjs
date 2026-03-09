<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import { Home } from 'lucide-svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-screen text-center px-6">
	<p class="text-6xl font-bold text-neutral-200 dark:text-neutral-700 mb-4">
		{$page.status}
	</p>

	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
		Page not found
	</h1>

	<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
		The page you're looking for doesn't exist.
	</p>

	<a href="/">
		<Button variant="primary">
			<Home size={18} />
			Go Home
		</Button>
	</a>
</div>
