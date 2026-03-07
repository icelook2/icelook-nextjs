import { browser } from '$app/environment';
import type { SearchSpecialist } from '$lib/types/specialist';

const STORAGE_KEY = 'recent-searches';
const MAX_ITEMS = 20;

export function getRecentSearches(): SearchSpecialist[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function addRecentSearch(specialist: SearchSpecialist): void {
	if (!browser) return;
	const items = getRecentSearches().filter((s) => s.id !== specialist.id);
	items.unshift(specialist);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function removeRecentSearch(id: number): void {
	if (!browser) return;
	const items = getRecentSearches().filter((s) => s.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearRecentSearches(): void {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}
