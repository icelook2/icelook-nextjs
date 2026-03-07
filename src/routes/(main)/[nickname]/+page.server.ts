import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { SpecialistResponse } from '$lib/types/specialist';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }) => {
	const cookie = request.headers.get('cookie');

	const res = await fetch(`${env.API_URL}/specialists/${params.nickname}`, {
		headers: cookie ? { cookie } : {}
	});

	if (!res.ok) {
		error(404, 'Specialist not found');
	}

	const data: SpecialistResponse = await res.json();

	return { specialist: data.specialist };
};
