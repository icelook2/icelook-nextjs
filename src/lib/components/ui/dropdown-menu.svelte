<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { MoreVertical } from 'lucide-svelte';

	interface MenuItem {
		label: string;
		icon?: Component;
		onclick: () => void;
		destructive?: boolean;
		disabled?: boolean;
	}

	interface Props {
		items: MenuItem[];
		align?: 'start' | 'end';
		trigger?: Snippet;
	}

	let { items, align = 'end', trigger }: Props = $props();

	let open = $state(false);
	let triggerEl: HTMLDivElement;
	let menuEl = $state<HTMLDivElement>();
	let coords = $state({ top: 0, left: 0 });

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	async function toggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (open) {
			open = false;
			return;
		}

		open = true;
		await tick();

		const rect = triggerEl.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;

		if (spaceBelow >= menuEl.offsetHeight + 4) {
			coords.top = rect.bottom + 4;
		} else {
			coords.top = rect.top - menuEl.offsetHeight - 4;
		}

		coords.left = align === 'end' ? rect.right - menuEl.offsetWidth : rect.left;
	}

	function close() {
		open = false;
	}

	$effect(() => {
		if (!open) return;

		function handleClick(e: MouseEvent) {
			if (
				menuEl &&
				!menuEl.contains(e.target as Node) &&
				!triggerEl.contains(e.target as Node)
			) {
				close();
			}
		}

		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				close();
			}
		}

		document.addEventListener('click', handleClick, true);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div bind:this={triggerEl} class="inline-block">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={toggle}>
		{#if trigger}
			{@render trigger()}
		{:else}
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
			>
				<MoreVertical size={16} />
			</button>
		{/if}
	</div>
</div>

{#if open}
	<div
		use:portal
		bind:this={menuEl}
		style="position: fixed; top: {coords.top}px; left: {coords.left}px; z-index: 9999;"
		class="min-w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
		role="menu"
	>
		{#each items as item (item.label)}
			<button
				type="button"
				role="menuitem"
				disabled={item.disabled}
				onclick={() => {
					item.onclick();
					close();
				}}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 {item.destructive
					? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50'
					: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}"
			>
				{#if item.icon}
					{@const Icon = item.icon}
					<Icon size={16} />
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
{/if}
