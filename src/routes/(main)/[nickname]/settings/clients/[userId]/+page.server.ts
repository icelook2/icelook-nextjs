import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { SpecialistResponse } from '$lib/types/specialist';
import type { ClientDetailsResponse } from '$lib/types/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }) => {
	const cookie = request.headers.get('cookie');
	const headers: Record<string, string> = {};
	if (cookie) headers.cookie = cookie;

	const specialistRes = await fetch(`${env.API_URL}/specialists/${params.nickname}`, { headers });
	if (!specialistRes.ok) error(404, 'Specialist not found');

	const { specialist }: SpecialistResponse = await specialistRes.json();

	const clientRes = await fetch(
		`${env.API_URL}/specialists/${specialist.id}/clients/${params.userId}`,
		{ headers }
	);
	if (!clientRes.ok) error(404, 'Client not found');

	const data: ClientDetailsResponse = await clientRes.json();
	return {
		client: data.client,
		upcomingAppointments: data.upcomingAppointments,
		pastAppointments: data.pastAppointments,
		specialistId: specialist.id
	};
};
