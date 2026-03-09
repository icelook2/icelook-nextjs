<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import IconButton from './icon-button.svelte';

	let { fallback = '/' }: { fallback?: string } = $props();

	let navigatedHere = $state(false);

	afterNavigate(() => {
		navigatedHere = true;
	});

	function goBack() {
		if (navigatedHere) {
			history.back();
		} else {
			goto(fallback);
		}
	}
</script>

<IconButton onclick={goBack} aria-label="Go back">
	<ArrowLeft size={20} />
</IconButton>
