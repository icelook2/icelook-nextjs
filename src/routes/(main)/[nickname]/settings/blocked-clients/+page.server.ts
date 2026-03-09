import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { SpecialistResponse } from '$lib/types/specialist';
import type { BlockedClientsResponse } from '$lib/types/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }) => {
	const cookie = request.headers.get('cookie');
	const headers: Record<string, string> = {};
	if (cookie) headers.cookie = cookie;

	const specialistRes = await fetch(`${env.API_URL}/specialists/${params.nickname}`, { headers });
	if (!specialistRes.ok) error(404, 'Specialist not found');

	const { specialist }: SpecialistResponse = await specialistRes.json();

	const clientsRes = await fetch(
		`${env.API_URL}/specialists/${specialist.id}/blocked-clients?page=1`,
		{ headers }
	);
	if (!clientsRes.ok) error(500, 'Failed to load blocked clients');

	const data: BlockedClientsResponse = await clientsRes.json();
	return { clients: data.clients, pagination: data.pagination, specialistId: specialist.id };
};
