import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import type { MySpecialist } from '$lib/types/specialist';

export const load: PageServerLoad = async ({ request }) => {
	const cookie = request.headers.get('cookie');
	const res = await fetch(`${env.API_URL}/me/specialists`, {
		headers: cookie ? { cookie } : {}
	});
	if (!res.ok) return { specialists: [] as MySpecialist[] };
	const data: { specialists: MySpecialist[] } = await res.json();
	return { specialists: data.specialists };
};
