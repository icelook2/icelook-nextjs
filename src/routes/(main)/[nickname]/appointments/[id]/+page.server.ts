import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { SpecialistAppointmentDetail } from '$lib/types/appointment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }) => {
	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : {};

	const res = await fetch(`${env.API_URL}/appointments/${params.id}`, { headers });
	if (!res.ok) error(404, 'Appointment not found');

	const data: { appointment: SpecialistAppointmentDetail } = await res.json();
	return data;
};
