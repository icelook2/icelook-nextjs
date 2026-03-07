import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { DefaultSpecialist } from '$lib/types/specialist';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		redirect(302, '/sign-in');
	}

	let defaultSpecialist: DefaultSpecialist | null = null;

	try {
		const cookie = request.headers.get('cookie');
		const res = await fetch(`${env.API_URL}/me/default-specialist`, {
			headers: cookie ? { cookie } : {}
		});
		if (res.ok) {
			const data: { specialist: DefaultSpecialist | null } = await res.json();
			defaultSpecialist = data.specialist;
		}
	} catch {
		/* API unreachable — graceful fallback */
	}

	return { user: locals.user, session: locals.session, defaultSpecialist };
};
