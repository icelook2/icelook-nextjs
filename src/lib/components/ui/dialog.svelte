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
	let contentEl: HTMLElement | undefined = $state();
	let innerContentEl: HTMLElement | undefined = $state();
	let showTopBorder = $state(false);
	let showBottomBorder = $state(false);

	function updateScrollState() {
		if (!contentEl) return;
		showTopBorder = contentEl.scrollTop > 0;
		showBottomBorder = contentEl.scrollTop + contentEl.clientHeight < contentEl.scrollHeight;
	}

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
			document.body.style.overflow = 'hidden';
			Promise.resolve().then(updateScrollState);
		} else if (!open && dialogEl.open) {
			dialogEl.close();
			document.body.style.overflow = '';
			showTopBorder = false;
			showBottomBorder = false;
		}
	});

	$effect(() => {
		if (!innerContentEl) return;
		const observer = new ResizeObserver(updateScrollState);
		observer.observe(innerContentEl);
		return () => observer.disconnect();
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
		'overflow-hidden',
		'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50',
		'backdrop:bg-black/50',
		className
	]}
	{...rest}
>
	<div class="flex flex-col max-h-[90dvh]">
		{#if header}
			<div class="shrink-0 p-6 pb-4 {showTopBorder ? 'border-b border-neutral-200 dark:border-neutral-800' : ''}">
				{@render header()}
			</div>
		{/if}

		<div
			bind:this={contentEl}
			onscroll={updateScrollState}
			class="flex-1 min-h-0 overflow-y-auto px-6 py-1 scrollbar-themed"
		>
			<div bind:this={innerContentEl}>
				{@render children?.()}
			</div>
		</div>

		{#if footer}
			<div class="shrink-0 p-6 pt-4 {showBottomBorder ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}">
				{@render footer()}
			</div>
		{/if}
	</div>
</dialog>
