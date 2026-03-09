import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
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

const handleSession: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	if (cookie) {
		try {
			const res = await fetch(`${env.API_URL}/api/auth/get-session`, {
				headers: { cookie }
			});
			if (res.ok) {
				const data: { session?: App.Locals['session']; user?: App.Locals['user'] } =
					await res.json();
				event.locals.session = data.session;
				event.locals.user = data.user;
			}
		} catch {
			/* API unreachable */
		}
	}
	return resolve(event);
};

const handleAuthGuard: Handle = ({ event, resolve }) => {
	const user = event.locals.user;
	const routeId = event.route.id ?? '';

	const isAuthRoute = routeId.startsWith('/(auth)');
	const isOnboardingRoute = routeId === '/onboarding';

	// Unauthenticated user accessing onboarding → sign-in
	if (!user && isOnboardingRoute) {
		redirect(302, '/sign-in');
	}

	// Authenticated user on auth pages → home or onboarding
	if (user && isAuthRoute) {
		redirect(302, user.onboardedAt ? '/' : '/onboarding');
	}

	// Authenticated but not onboarded → force to onboarding
	if (user && !user.onboardedAt && routeId && !isOnboardingRoute) {
		redirect(302, '/onboarding');
	}

	// Authenticated and onboarded → block re-access to onboarding
	if (user && user.onboardedAt && isOnboardingRoute) {
		redirect(302, '/');
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleTheme, handleParaglide, handleSession, handleAuthGuard);
