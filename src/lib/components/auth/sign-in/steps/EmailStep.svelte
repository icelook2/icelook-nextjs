<script lang="ts">
	import { getSignInContext } from '../context';

	const auth = getSignInContext();

	function handleSubmit(_event: SubmitEvent) {
		auth.step = 'verify-otp';
	}
</script>

<form onsubmit={handleSubmit}>
	<button>Submit</button>
</form>
