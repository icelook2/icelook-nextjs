<script lang="ts">
	import { page } from '$app/state';
	import ClientDetail from '$lib/components/client-detail.svelte';

	let { data } = $props();
</script>

<ClientDetail
	specialistId={data.specialistId}
	userId={data.client.id}
	nickname={page.params.nickname!}
	backUrl="/{page.params.nickname}/settings/clients"
	client={data.client}
	upcomingAppointments={data.upcomingAppointments}
	pastAppointments={data.pastAppointments}
/>
