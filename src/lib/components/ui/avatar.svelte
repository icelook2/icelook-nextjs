<script lang="ts">
	type Size = 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		src?: string | null;
		name?: string;
		size?: Size;
		class?: string;
	}

	let { src, name = '', size = 'md', class: className }: Props = $props();

	let imgError = $state(false);

	const sizeClasses: Record<Size, string> = {
		sm: 'h-8 w-8 text-xs',
		md: 'h-10 w-10 text-sm',
		lg: 'h-12 w-12 text-base',
		xl: 'h-24 w-24 text-xl'
	};

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/);
		if (parts.length === 0 || !parts[0]) return '?';
		const first = parts[0][0];
		const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
		return (first + last).toUpperCase();
	}

	const showImage = $derived(src && !imgError);
</script>

{#if showImage}
	<img
		{src}
		alt={name}
		class={['rounded-full object-cover', sizeClasses[size], className]}
		onerror={() => (imgError = true)}
	/>
{:else}
	<div
		class={[
			'inline-flex items-center justify-center rounded-full bg-neutral-200 font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
			sizeClasses[size],
			className
		]}
	>
		{getInitials(name)}
	</div>
{/if}
