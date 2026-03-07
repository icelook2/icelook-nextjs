import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	const cookie = request.headers.get('cookie');
	const res = await fetch(`${env.API_URL}/me`, {
		headers: cookie ? { cookie } : {}
	});

	if (!res.ok) {
		return { profile: null };
	}

	const data: {
		user: {
			id: number;
			name: string;
			email: string;
			imageUrl: string | null;
		};
	} = await res.json();

	return { profile: data.user };
};
