import { createRawSnippet } from 'svelte';
import { vi } from 'vitest';
import { useSearchStore, defaultSearchFilters } from '#lib/stores/search.ts';
import { toast } from '#lib/stores/toast.svelte.ts';

/** A children snippet rendering a marker element. */
export function childrenSnippet(text = 'child-content') {
	return createRawSnippet(() => ({ render: () => `<p data-testid="children">${text}</p>` }));
}

/** Stub fetch for /api/specialists (SpecialtyAutocomplete). */
export function stubSpecialistsFetch(items: Array<{ name: string; slug: string }> = []) {
	const fn = vi.fn(async () => new Response(JSON.stringify(items), { status: 200 }));
	vi.stubGlobal('fetch', fn);
	return fn;
}

export function resetStores() {
	useSearchStore.setState({
		query: '',
		results: [],
		filters: { ...defaultSearchFilters, specialties: [] },
		draftFilters: { ...defaultSearchFilters, specialties: [] },
		isFilterOpen: false,
		bookmarkedIds: []
	});
	toast.clear();
}

/**
 * Replace window.location with a stub capturing `href` assignments (jsdom does not
 * implement navigation). Returns the setter spy and a restore function.
 */
export function mockLocationHref() {
	const original = window.location;
	const setHref = vi.fn();
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: {
			get href() {
				return 'http://localhost/';
			},
			set href(v: string) {
				setHref(v);
			}
		}
	});
	return {
		setHref,
		restore: () => Object.defineProperty(window, 'location', { configurable: true, value: original })
	};
}

export const testUser = {
	id: 'u1',
	name: 'Jane Doe',
	email: 'jane@example.com',
	role: 'patient' as const,
	avatarUrl: null as string | null
};
