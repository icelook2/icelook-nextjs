<script lang="ts">
	import BackButton from '$lib/components/ui/back-button.svelte';
	import SearchInput from '$lib/components/ui/search-input.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import SpecialistCard from '$lib/components/specialist-card.svelte';
	import { debounce } from '$lib/utils/debounce';
	import {
		getRecentSearches,
		addRecentSearch,
		removeRecentSearch,
		clearRecentSearches
	} from '$lib/utils/recent-searches';
	import type { SearchSpecialist, SearchResponse } from '$lib/types/specialist';

	let query = $state('');
	let results = $state<SearchSpecialist[]>([]);
	let page = $state(1);
	let totalPages = $state(0);
	let loading = $state(false);
	let loadingMore = $state(false);
	let error = $state('');
	let hasSearched = $state(false);
	let recentSearches = $state<SearchSpecialist[]>(getRecentSearches());

	let abortController: AbortController | null = null;

	async function fetchResults(q: string, p: number, append = false) {
		if (!q.trim()) return;

		abortController?.abort();
		abortController = new AbortController();

		if (append) {
			loadingMore = true;
		} else {
			loading = true;
			error = '';
		}

		try {
			const res = await fetch(
				`/search?q=${encodeURIComponent(q.trim())}&page=${p}`,
				{ signal: abortController.signal }
			);

			if (!res.ok) {
				if (res.status === 429) {
					error = 'Too many requests. Please wait a moment and try again.';
				} else {
					error = 'Something went wrong. Please try again.';
				}
				return;
			}

			const data: SearchResponse = await res.json();

			if (append) {
				results = [...results, ...data.specialists];
			} else {
				results = data.specialists;
			}
			page = data.pagination.page;
			totalPages = data.pagination.totalPages;
			hasSearched = true;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	const debouncedSearch = debounce((q: string) => {
		if (q.trim()) {
			page = 1;
			fetchResults(q, 1);
		}
	}, 300);

	$effect(() => {
		if (query.trim()) {
			debouncedSearch(query);
		} else {
			abortController?.abort();
			results = [];
			hasSearched = false;
			error = '';
			recentSearches = getRecentSearches();
		}
	});

	function handleSpecialistClick(specialist: SearchSpecialist) {
		addRecentSearch(specialist);
	}

	function handleRemoveRecent(id: number) {
		removeRecentSearch(id);
		recentSearches = getRecentSearches();
	}

	function handleClearAll() {
		clearRecentSearches();
		recentSearches = [];
	}

	function handleShowMore() {
		fetchResults(query, page + 1, true);
	}

	const showEmpty = $derived(!query.trim() && recentSearches.length === 0);
	const showRecent = $derived(!query.trim() && recentSearches.length > 0);
	const showNoResults = $derived(hasSearched && !loading && results.length === 0 && !error);
	const showEndMessage = $derived(hasSearched && results.length > 0 && page >= totalPages);
	const canShowMore = $derived(hasSearched && results.length > 0 && page < totalPages);
</script>

<div class="mx-auto flex h-full w-full max-w-2xl flex-col px-6 py-6">
	<header class="flex items-center gap-3">
		<BackButton />
		<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Search</h1>
	</header>

	<div class="mt-4">
		<SearchInput bind:value={query} placeholder="Search specialists..." autofocus />
	</div>

	<div class="mt-4 flex-1 overflow-y-auto">
		{#if showEmpty}
			<p class="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
				Search for specialists by name or nickname
			</p>
		{/if}

		{#if showRecent}
			<div class="mb-2 flex items-center justify-between">
				<h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Recent</h2>
				<button
					type="button"
					class="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
					onclick={handleClearAll}
				>
					Clear all
				</button>
			</div>
			{#each recentSearches as specialist (specialist.id)}
				<SpecialistCard
					{specialist}
					showRemove
					onremove={() => handleRemoveRecent(specialist.id)}
				/>
			{/each}
		{/if}

		{#if loading}
			<div class="flex justify-center py-12">
				<svg
					class="h-6 w-6 animate-spin text-neutral-400"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			</div>
		{/if}

		{#if error}
			<p class="py-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
		{/if}

		{#if showNoResults}
			<p class="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
				No specialists found for "{query.trim()}"
			</p>
		{/if}

		{#if !loading && results.length > 0}
			{#each results as specialist (specialist.id)}
				<SpecialistCard {specialist} onclick={() => handleSpecialistClick(specialist)} />
			{/each}

			{#if canShowMore}
				<div class="flex justify-center py-4">
					<Button variant="outline" size="sm" loading={loadingMore} onclick={handleShowMore}>
						Show more
					</Button>
				</div>
			{/if}

			{#if showEndMessage}
				<p class="py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
					No more specialists to show
				</p>
			{/if}
		{/if}
	</div>
</div>
