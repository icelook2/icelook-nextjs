import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleTheme: Handle = ({ event, resolve }) => {
	const cookie = event.cookies.get('theme');
	const theme = cookie === 'light' || cookie === 'dark' ? cookie : 'system';
	event.locals.theme = theme;

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// For known light/dark, inject class server-side — zero FOUT
			if (theme === 'dark') return html.replace('<html ', '<html class="dark" ');
			if (theme === 'light') return html.replace('<html ', '<html class="" ');
			// For 'system' (no cookie), a minimal inline script handles it client-side
			return html;
		}
	});
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleTheme, handleParaglide, handleBetterAuth);
