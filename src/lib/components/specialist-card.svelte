<script lang="ts">
	import Avatar from '$lib/components/ui/avatar.svelte';
	import type { SearchSpecialist } from '$lib/types/specialist';
	import { Star, X } from 'lucide-svelte';

	interface Props {
		specialist: SearchSpecialist;
		showRemove?: boolean;
		onremove?: () => void;
		onclick?: () => void;
	}

	let { specialist, showRemove = false, onremove, onclick }: Props = $props();
</script>

<a
	href="/{specialist.nickname}"
	class="flex items-center gap-3 py-2"
	onclick={onclick}
>
	<Avatar src={specialist.avatarUrl} name={specialist.name} size="lg" />

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
			{specialist.name}
		</p>
		<p class="truncate text-xs text-neutral-500 dark:text-neutral-400">@{specialist.nickname}</p>
	</div>

	{#if specialist.averageRating !== null}
		<div
			class="flex shrink-0 items-center gap-0.5 text-xs text-neutral-500 dark:text-neutral-400"
		>
			<Star size={12} class="fill-amber-400 text-amber-400" />
			{specialist.averageRating.toFixed(1)}
		</div>
	{/if}

	{#if showRemove && onremove}
		<button
			type="button"
			class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onremove();
			}}
			aria-label="Remove from recent"
		>
			<X size={14} />
		</button>
	{/if}
</a>
