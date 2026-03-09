import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { SpecialistResponse } from '$lib/types/specialist';
import type { WorkingDay } from '$lib/types/working-day';
import type { PageServerLoad } from './$types';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ params, request, url }) => {
	const dateParam = url.searchParams.get('date');
	const date = dateParam ?? format(new Date(), 'yyyy-MM-dd');

	const cookie = request.headers.get('cookie');
	const headers = cookie ? { cookie } : {};

	const specialistRes = await fetch(`${env.API_URL}/specialists/${params.nickname}`, { headers });

	if (!specialistRes.ok) error(404, 'Specialist not found');

	const specialistData: SpecialistResponse = await specialistRes.json();
	const timezone = specialistData.specialist.timezone;
	const specialistId = specialistData.specialist.id;
	const timeStep = specialistData.specialist.timeStep;

	const workingDayRes = await fetch(`${env.API_URL}/specialists/${specialistId}/working-days/${date}`, { headers });

	if (!workingDayRes.ok) {
		return { timezone, workingDay: null, date, specialistId, timeStep };
	}

	const workingDayData: { workingDay: WorkingDay } = await workingDayRes.json();
	return { timezone, workingDay: workingDayData.workingDay, date, specialistId, timeStep };
};
