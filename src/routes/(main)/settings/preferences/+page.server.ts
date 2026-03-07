import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const cookie = request.headers.get('cookie');
	const res = await fetch(`${env.API_URL}/me`, {
		headers: cookie ? { cookie } : {}
	});

	if (!res.ok) {
		return { preferences: null };
	}

	const data: {
		user: {
			preferences: {
				prefersMinimalConversation: boolean;
			};
		};
	} = await res.json();

	return { preferences: data.user.preferences };
};
