import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { defaultSpecialist } = await parent();
	if (defaultSpecialist) redirect(302, `/${defaultSpecialist.nickname}/schedule`);
	redirect(302, '/appointments');
};
