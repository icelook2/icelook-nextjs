<script lang="ts">
	import { setTheme, getTheme } from '$lib/theme.svelte';
	import type { Theme } from '$lib/theme.svelte';

	const options: Theme[] = ['light', 'dark', 'system'];
</script>

<div class="flex gap-4 p-8">
	{#each options as option (option)}
		<button
			onclick={() => setTheme(option)}
			class="capitalize {getTheme() === option ? 'underline' : ''}"
		>
			{option}
		</button>
	{/each}
</div>
