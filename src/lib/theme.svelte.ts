import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';
const COOKIE_KEY = 'theme';

let theme = $state<Theme>('system');

function applyTheme(t: Theme) {
	if (!browser) return;
	const isDark =
		t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', isDark);
}

export function setTheme(t: Theme) {
	theme = t;
	// Persist as a cookie readable by the server; 1 year expiry
	document.cookie = `${COOKIE_KEY}=${t}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
	applyTheme(t);
}

let listenerRegistered = false;

export function initTheme(serverTheme: Theme) {
	theme = serverTheme;
	applyTheme(serverTheme);

	if (browser && !listenerRegistered) {
		listenerRegistered = true;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', () => {
			if (theme === 'system') applyTheme('system');
		});
	}
}

export function getTheme() {
	return theme;
}
