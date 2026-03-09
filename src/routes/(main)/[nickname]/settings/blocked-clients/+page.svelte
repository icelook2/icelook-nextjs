<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';
	import type { BlockedClientListItem, BlockedClientsResponse } from '$lib/types/client';
	import { ShieldOff } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';

	let { data } = $props();

	let extraClients: BlockedClientListItem[] = $state([]);
	let extraPagination: { page: number; totalPages: number; totalCount: number } | null =
		$state(null);
	let loading = $state(false);

	let clients = $derived([...data.clients, ...extraClients]);
	let pagination = $derived(extraPagination ?? data.pagination);

	async function loadMore() {
		loading = true;
		try {
			const res = await fetch(
				`${env.PUBLIC_API_URL}/specialists/${data.specialistId}/blocked-clients?page=${pagination.page + 1}`,
				{ credentials: 'include' }
			);
			if (res.ok) {
				const next: BlockedClientsResponse = await res.json();
				extraClients = [...extraClients, ...next.clients];
				extraPagination = next.pagination;
			}
		} finally {
			loading = false;
		}
	}
</script>

<header class="flex items-center gap-3">
	<BackButton fallback="/{page.params.nickname}/settings" />
	<h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Blocked clients</h1>
</header>

{#if clients.length === 0}
	<div class="mt-8 flex flex-col items-center gap-3 py-12 text-neutral-400 dark:text-neutral-500">
		<ShieldOff size={40} />
		<p class="text-sm">No blocked clients</p>
	</div>
{:else}
	<div class="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
		{#each clients as client (client.id)}
			<button
				onclick={() => goto(`/${page.params.nickname}/settings/blocked-clients/${client.id}`)}
				class="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
			>
				<Avatar src={client.image} name={client.name} size="md" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
						{client.name}
					</p>
					{#if client.email}
						<p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
							{client.email}
						</p>
					{/if}
				</div>
				{#if client.blockedAt}
					<span class="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
						Blocked {formatDistanceToNow(new Date(client.blockedAt), { addSuffix: true })}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if pagination.page < pagination.totalPages}
		<button
			onclick={loadMore}
			disabled={loading}
			class="mt-4 w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
		>
			{loading ? 'Loading...' : 'Load more'}
		</button>
	{/if}
{/if}
