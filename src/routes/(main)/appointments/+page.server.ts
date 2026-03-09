import { env } from '$env/dynamic/private';
import type { AppointmentsResponse } from '$lib/types/appointment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : {};

	try {
		const res = await fetch(`${env.API_URL}/me/appointments?period=upcoming`, { headers });
		if (!res.ok) return { appointments: [], pagination: null };
		const data: AppointmentsResponse = await res.json();
		return data;
	} catch {
		return { appointments: [], pagination: null };
	}
};
