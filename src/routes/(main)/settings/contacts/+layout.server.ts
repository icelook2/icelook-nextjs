import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	const cookie = request.headers.get('cookie');
	const res = await fetch(`${env.API_URL}/me`, {
		headers: cookie ? { cookie } : {}
	});

	if (!res.ok) {
		return { contacts: null };
	}

	const data: {
		user: {
			contacts: {
				phoneNumber1: string | null;
				phoneNumber2: string | null;
				instagram: string | null;
				telegram: string | null;
				whatsapp: string | null;
				viber: string | null;
			};
		};
	} = await res.json();

	return { contacts: data.user.contacts };
};
