import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

interface Session {
	token: string;
	userAgent: string;
	ipAddress: string;
	createdAt: string;
}

export const load: PageServerLoad = async ({ locals, request }) => {
	const cookie = request.headers.get('cookie');
	const res = await fetch(`${env.API_URL}/api/auth/list-sessions`, {
		headers: cookie ? { cookie } : {}
	});
	if (!res.ok) return { sessions: [] as Session[], currentToken: locals.session?.token ?? null };
	const sessions: Session[] = await res.json();
	return { sessions, currentToken: locals.session?.token ?? null };
};
