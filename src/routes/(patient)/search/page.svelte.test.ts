import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { defaultSearchFilters, useSearchStore } from '#lib/stores/search.ts';
import { resetStores, testUser } from '../../../test/helpers-pages-public.ts';

/*
 * `seed()` presets the store (e.g. a wide price range) for some tests; the page also
 * reacts to store changes after mount, which the "fresh visit" tests rely on.
 */

const doc = (id: string, name: string, over: Record<string, unknown> = {}) => ({
	id,
	name,
	specialty: 'Cardiology',
	hospital: 'RSUD',
	imageUrl: null,
	rating: '4.5',
	reviewCount: 3,
	specialistSlug: 'cardiology',
	isOnline: true,
	...over
});

const doctors = [doc('d1', 'Dr. Alice'), doc('d2', 'Dr. Bob', { specialty: 'Dental' })];
const specialists = [{ id: 's1', name: 'Cardiology', slug: 'cardiology', icon: null }];

function data(over: Record<string, unknown> = {}) {
	return {
		user: testUser,
		query: '',
		doctors,
		allDoctors: doctors,
		specialists,
		openFilter: false,
		...over
	};
}

function seed(extra: Record<string, unknown> = {}) {
	useSearchStore.setState({
		results: doctors,
		filters: { ...defaultSearchFilters, specialties: [], priceRange: [0, 500] },
		...extra
	});
}

beforeEach(() => {
	resetStores();
});
afterEach(() => {
	vi.useRealTimers();
});

function searchbox() {
	return screen.getByRole('searchbox');
}

describe('search page', () => {
	it('renders seeded results and bookmark toggles the store', async () => {
		seed({ bookmarkedIds: ['d2'] });
		render(Page, { props: { data: data() } as never });
		expect(screen.getByText('Dr. Alice')).toBeInTheDocument();
		expect(screen.getByText(/results found/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeInTheDocument();
		const marked = screen.getByRole('button', { name: 'Remove bookmark' });
		expect(marked.querySelector('.lucide-bookmark')).toHaveClass('fill-primary');
		const unmarked = screen.getByRole('button', { name: 'Bookmark doctor' });
		expect(unmarked.querySelector('.fill-primary.lucide-bookmark')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Bookmark doctor' }));
		expect(useSearchStore.getState().bookmarkedIds).toEqual(['d2', 'd1']);
	});

	it('typing filters locally, debounced url sync, singular wording', async () => {
		seed();
		vi.useFakeTimers();
		render(Page, { props: { data: data() } as never });
		await fireEvent.input(searchbox(), { target: { value: 'bob' } });
		await fireEvent.input(searchbox(), { target: { value: 'bob ' } });
		expect(screen.getByText(/result found/)).toBeInTheDocument();
		expect(screen.queryByText('Dr. Alice')).toBeNull();
		vi.advanceTimersByTime(400);
		expect(goto).toHaveBeenCalledWith('/search?q=bob', { replace: true, reset: false });
		expect(useSearchStore.getState().query).toBe('bob ');
	});

	it('submit keeps filter=open; clear search; open filter sets store', async () => {
		seed();
		render(Page, { props: { data: data({ query: 'alice', openFilter: true }) } as never });
		expect(useSearchStore.getState().isFilterOpen).toBe(true);
		await fireEvent.submit(searchbox().closest('form')!);
		expect(goto).toHaveBeenCalledWith('/search?q=alice&filter=open', {
			replace: true,
			reset: false
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
		expect(goto).toHaveBeenLastCalledWith('/search?filter=open', { replace: true, reset: false });
		expect(useSearchStore.getState().query).toBe('');
		useSearchStore.setState({ isFilterOpen: false });
		await fireEvent.click(screen.getByRole('button', { name: /^Filter$/ }));
		expect(useSearchStore.getState().isFilterOpen).toBe(true);
	});

	it('filter modal Show Results syncs url without filter param', async () => {
		seed({ isFilterOpen: true });
		render(Page, { props: { data: data({ openFilter: true }) } as never });
		await fireEvent.click(screen.getByRole('button', { name: /Show Results/ }));
		expect(goto).toHaveBeenLastCalledWith('/search', { replace: true, reset: false });
	});

	it('empty results and guest header', async () => {
		render(Page, { props: { data: data({ user: null, allDoctors: [], doctors: [] }) } as never });
		expect(screen.getByText(/No doctors match your search/)).toBeInTheDocument();
		await fireEvent.submit(searchbox().closest('form')!);
		expect(goto).toHaveBeenCalledWith('/search', { replace: true, reset: false });
	});
});

// Mock prices (doctorPrice): doc-a → 84, doc-b → 101, alice → 170, d1 → 333 (outside the
// default $50–$250 range).
const fresh = [
	doc('doc-a', 'Dr. Ann', { reviewCount: 9, rating: '4.1', hospital: 'Zeta' }),
	doc('doc-b', 'Dr. Ben', {
		specialty: 'Dental',
		specialistSlug: 'dental',
		isOnline: false,
		reviewCount: 5,
		rating: '4.9',
		hospital: 'Alpha'
	}),
	doc('alice', 'Dr. Cara', { reviewCount: 1, rating: '3.0', hospital: 'Mid' }),
	doc('d1', 'Dr. Dear')
];
const freshSpecialists = [
	...specialists,
	{ id: 's2', name: 'Dental', slug: 'dental', icon: null }
];
const freshData = (over: Record<string, unknown> = {}) =>
	data({ doctors: fresh, allDoctors: fresh, specialists: freshSpecialists, ...over });
const names = () =>
	Array.from(document.querySelectorAll('article p.font-heading'), (p) => p.textContent?.trim());
const count = () => screen.getByText(/results? found/).textContent?.replace(/\s+/g, ' ').trim();

describe('search page – reactive store (fresh visit)', () => {
	it('shows the right result count from data without pre-seeding the store', () => {
		render(Page, { props: { data: freshData() } as never });
		expect(count()).toBe('3 results found');
		expect(screen.getByText('Dr. Ann')).toBeInTheDocument();
		expect(screen.queryByText('Dr. Dear')).toBeNull();
		expect(useSearchStore.getState().results).toHaveLength(4);
	});

	it('opens the filter after mount, toggles filters and applies them', async () => {
		render(Page, { props: { data: freshData() } as never });
		expect(screen.queryByRole('dialog')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: /^Filter$/ }));
		const dialog = screen.getByRole('dialog', { name: 'Filter Options' });
		const badge = () =>
			within(dialog).getByRole('button', { name: /Show Results/ }).querySelector('span')!.textContent?.trim();
		expect(badge()).toBe('3');

		await fireEvent.click(within(dialog).getByRole('button', { name: 'Cardiology' }));
		expect(within(dialog).getByRole('button', { name: 'Cardiology' })).toHaveClass('bg-primary');
		expect(badge()).toBe('2');
		// Draft changes do not affect the visible results until applied.
		expect(count()).toBe('3 results found');

		await fireEvent.click(within(dialog).getByRole('button', { name: 'Rating' }));
		expect(within(dialog).getByRole('button', { name: 'Rating' })).toHaveClass('bg-primary');

		await fireEvent.click(within(dialog).getByRole('button', { name: /Show Results/ }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(count()).toBe('2 results found');
		expect(screen.queryByText('Dr. Ben')).toBeNull();
		expect(names()).toEqual(['Dr. Ann', 'Dr. Cara']);
		expect(goto).toHaveBeenLastCalledWith('/search', { replace: true, reset: false });
	});

	it('typing narrows the count reactively', async () => {
		render(Page, { props: { data: freshData() } as never });
		await fireEvent.input(searchbox(), { target: { value: 'dental' } });
		expect(count()).toBe('1 result found');
		expect(names()).toEqual(['Dr. Ben']);
	});

	it.each([
		['Close', () => screen.getByRole('button', { name: 'Close filters' })],
		['backdrop', () => screen.getByRole('presentation')]
	])('closing the filter via %s discards the draft', async (_label, target) => {
		render(Page, { props: { data: freshData() } as never });
		await fireEvent.click(screen.getByRole('button', { name: /^Filter$/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Dental' }));
		await fireEvent.click(target());
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(count()).toBe('3 results found');
		await fireEvent.click(screen.getByRole('button', { name: /^Filter$/ }));
		expect(screen.getByRole('button', { name: 'Dental' })).not.toHaveClass('bg-primary');
	});

	it('opens the filter when data.openFilter is set', () => {
		render(Page, { props: { data: freshData({ openFilter: true }) } as never });
		expect(screen.getByRole('dialog', { name: 'Filter Options' })).toBeInTheDocument();
	});

	it('bookmark icon updates after toggling', async () => {
		render(Page, { props: { data: freshData() } as never });
		expect(screen.queryByRole('button', { name: 'Remove bookmark' })).toBeNull();
		await fireEvent.click(screen.getAllByRole('button', { name: 'Bookmark doctor' })[0]);
		expect(screen.getAllByRole('button', { name: 'Remove bookmark' })).toHaveLength(1);
		expect(useSearchStore.getState().bookmarkedIds).toEqual(['doc-a']);
		await fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));
		expect(screen.queryByRole('button', { name: 'Remove bookmark' })).toBeNull();
		expect(useSearchStore.getState().bookmarkedIds).toEqual([]);
	});
});
