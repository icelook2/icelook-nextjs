<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import { Search, Home } from 'lucide-svelte';
</script>

<div class="mx-auto w-full max-w-2xl px-6 py-6">
	<div class="flex flex-col items-center justify-center min-h-screen text-center">
		<p class="text-6xl font-bold text-neutral-200 dark:text-neutral-700 mb-4">
			{$page.status}
		</p>

		<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
			Specialist not found
		</h1>

		<p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
			This specialist doesn't exist or the link is broken. Try searching for other specialists.
		</p>

		<div class="flex gap-3">
			<a href="/search">
				<Button variant="primary">
					<Search size={18} />
					Go to Search
				</Button>
			</a>
			<a href="/">
				<Button variant="secondary">
					<Home size={18} />
					Go Home
				</Button>
			</a>
		</div>
	</div>
</div>
