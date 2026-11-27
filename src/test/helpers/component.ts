import { createRawSnippet } from 'svelte';
import { within } from '@testing-library/svelte';
import { vi } from 'vitest';
import { useSearchStore, defaultSearchFilters } from '#lib/stores/search.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import { update } from '../mocks/app-forms.ts';

/** Build a static snippet from an HTML string (must have a single root element). */
export function snip(html: string) {
	return createRawSnippet(() => ({ render: () => html }));
}

/** Make the next enhance `update()` resolve after `ms`, leaving a window to interact mid-submit. */
export function slowNextUpdate(ms = 30): void {
	update.mockImplementationOnce(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
}

/** Dispatch Escape on window synchronously (Modal listens via <svelte:window onkeydown>). */
export function pressEscape(): void {
	window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/**
 * Closes the open ConfirmDialog with Escape (which clears the page's confirm target) and,
 * in the same synchronous tick — before Svelte flushes — clicks its confirm button.
 * Exercises the `if (!confirmTarget) return` guard in the pages' confirmDelete().
 */
export function escapeThenConfirm(dialog: HTMLElement, confirmLabel = 'Delete'): void {
	const btn = within(dialog).getByRole('button', { name: confirmLabel });
	pressEscape();
	btn.click();
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
