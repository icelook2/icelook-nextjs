<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	interface Props extends HTMLDialogAttributes {
		open?: boolean;
		class?: string;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		class: className,
		header,
		children,
		footer,
		...rest
	}: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
			document.body.style.overflow = 'hidden';
		} else if (!open && dialogEl.open) {
			dialogEl.close();
			document.body.style.overflow = '';
		}
	});

	function handleClose() {
		open = false;
		document.body.style.overflow = '';
	}

	function handleClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			open = false;
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	onclose={handleClose}
	onclick={handleClick}
	class={[
		'fixed m-0 w-full max-w-none rounded-t-2xl p-0',
		'top-auto bottom-0 left-0 right-0',
		'sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
		'sm:max-w-lg sm:rounded-2xl',
		'max-h-[80dvh] sm:max-h-[85vh]',
		'open:flex open:flex-col',
		'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50',
		'backdrop:bg-black/50',
		className
	]}
	{...rest}
>
	{#if header}
		<div class="shrink-0 p-6 pb-4">
			{@render header()}
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto px-6 py-1">
		{@render children?.()}
	</div>

	{#if footer}
		<div class="shrink-0 p-6 pt-4">
			{@render footer()}
		</div>
	{/if}
</dialog>
