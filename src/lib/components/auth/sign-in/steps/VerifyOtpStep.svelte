<script lang="ts">
	import { getSignInContext } from '../context';

	const auth = getSignInContext();

	function handleClick() {
		auth.step = 'email';
	}
</script>

<button on:click={handleClick}>Back</button>
