import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	defaultSearchFilters,
	useSearchStore,
	type DoctorSearchResult,
	type SearchFilters
} from '#lib/stores/search.ts';
import FilterOptionsModal from './FilterOptionsModal.svelte';

// Mock prices (doctorPrice): doc-1 → 168, doc-2 → 185, z → 324
const doctors: DoctorSearchResult[] = [
	{
		id: 'doc-1',
		name: 'Dr. A',
		specialty: 'Cardiology',
		hospital: 'B Hospital',
		imageUrl: null,
		rating: '4.2',
		reviewCount: 10,
		specialistSlug: 'cardiology',
		isOnline: true
	},
	{
		id: 'doc-2',
		name: 'Dr. B',
		specialty: 'Dental',
		hospital: 'A Hospital',
		imageUrl: null,
		rating: '4.9',
		reviewCount: 50,
		specialistSlug: 'dental',
		isOnline: false
	},
	{
		id: 'z',
		name: 'Dr. Z',
		specialty: 'Cardiology',
		hospital: 'C Hospital',
		imageUrl: null,
		rating: '4.0',
		reviewCount: 5,
		specialistSlug: 'cardiology',
		isOnline: true
	}
];

const specialists = [
	{ name: 'Cardiology', slug: 'cardiology' },
	{ name: 'Dental', slug: 'dental' }
];

const initial = useSearchStore.getInitialState();

afterEach(() => {
	useSearchStore.setState(initial, true);
});

const draft = () => useSearchStore.getState().draftFilters;
const countBadge = () =>
	screen.getByRole('button', { name: /Show Results/ }).querySelector('span')!.textContent?.trim();

/** Seed the store and render. The component re-renders on later store changes. */
function setup(opts: { draft?: Partial<SearchFilters>; open?: boolean; query?: string } = {}) {
	useSearchStore.setState(
		{
			...initial,
			results: doctors,
			isFilterOpen: opts.open ?? true,
			filters: { ...defaultSearchFilters },
			draftFilters: { ...defaultSearchFilters, specialties: [], ...opts.draft }
		},
		true
	);
	const onShowResults = vi.fn();
	render(FilterOptionsModal, { specialists, query: opts.query ?? '', onShowResults });
	return { onShowResults };
}

describe('FilterOptionsModal', () => {
	it('renders nothing when filter is closed', () => {
		setup({ open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders sections with defaults and preview count', () => {
		setup();
		const container = document.body;
		expect(screen.getByRole('dialog', { name: 'Filter Options' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Recommended' })).toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Rating' })).not.toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Cardiology' })).not.toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Today' })).not.toHaveClass('border-primary');
		expect(screen.getByText('$50 - $250')).toBeInTheDocument();
		expect(countBadge()).toBe('2');
		expect(screen.getByLabelText('Minimum price')).toHaveValue('50');
		expect(screen.getByLabelText('Maximum price')).toHaveValue('250');
		const track = container.querySelector<HTMLElement>('.absolute.h-2.bg-primary')!;
		expect(track.style.left).toBe('10%');
		expect(track.style.right).toBe('50%');
	});

	it('renders seeded draft selections', () => {
		setup({
			draft: {
				sortBy: 'rating',
				specialties: ['cardiology'],
				availability: 'today',
				priceRange: [0, 500]
			}
		});
		expect(screen.getByRole('button', { name: 'Rating' })).toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Cardiology' })).toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Dental' })).not.toHaveClass('bg-primary');
		const today = screen.getByRole('button', { name: 'Today' });
		expect(today).toHaveClass('border-primary');
		expect(today.querySelector('.h-2\\.5.bg-primary')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'This Week' }).querySelector('.h-2\\.5')).toBeNull();
		expect(screen.getByText('$0 - $500+')).toBeInTheDocument();
		// cardiology + online + any price → doc-1 and z
		expect(countBadge()).toBe('2');
	});

	it('preview count respects the query', () => {
		setup({ query: 'dental' });
		expect(countBadge()).toBe('1');
	});

	it('changes sort option in the draft', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Distance' }));
		expect(draft().sortBy).toBe('distance');
	});

	it('adds a specialty to the draft', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Cardiology' }));
		expect(draft().specialties).toEqual(['cardiology']);
	});

	it('removes an already selected specialty', async () => {
		setup({ draft: { specialties: ['cardiology', 'dental'] } });
		await fireEvent.click(screen.getByRole('button', { name: 'Cardiology' }));
		expect(draft().specialties).toEqual(['dental']);
	});

	it('selects availability', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Today' }));
		expect(draft().availability).toBe('today');
	});

	it('deselects the active availability', async () => {
		setup({ draft: { availability: 'week' } });
		await fireEvent.click(screen.getByRole('button', { name: 'This Week' }));
		expect(draft().availability).toBeNull();
	});

	it('clamps minimum price to the current maximum', async () => {
		setup();
		await fireEvent.input(screen.getByLabelText('Minimum price'), { target: { value: '400' } });
		expect(draft().priceRange).toEqual([250, 250]);
	});

	it('accepts a minimum price below the maximum', async () => {
		setup();
		await fireEvent.input(screen.getByLabelText('Minimum price'), { target: { value: '100' } });
		expect(draft().priceRange).toEqual([100, 250]);
	});

	it('clamps maximum price to the current minimum', async () => {
		setup({ draft: { priceRange: [200, 250] } });
		await fireEvent.input(screen.getByLabelText('Maximum price'), { target: { value: '100' } });
		expect(draft().priceRange).toEqual([200, 200]);
	});

	it('accepts a maximum price above the minimum', async () => {
		setup();
		await fireEvent.input(screen.getByLabelText('Maximum price'), { target: { value: '500' } });
		expect(draft().priceRange).toEqual([50, 500]);
	});

	it('applies filters and calls onShowResults', async () => {
		const { onShowResults } = setup({ draft: { sortBy: 'rating' } });
		await fireEvent.click(screen.getByRole('button', { name: /Show Results/ }));
		expect(onShowResults).toHaveBeenCalledTimes(1);
		expect(useSearchStore.getState().filters.sortBy).toBe('rating');
		expect(useSearchStore.getState().isFilterOpen).toBe(false);
	});

	it('clears all filters', async () => {
		setup({ draft: { specialties: ['dental'] } });
		await fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
		expect(draft()).toEqual({
			sortBy: 'recommended',
			specialties: [],
			availability: null,
			priceRange: [0, 500]
		});
	});

	it('closes via close button', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
		expect(useSearchStore.getState().isFilterOpen).toBe(false);
	});

	it('closes via backdrop click', async () => {
		setup();
		await fireEvent.click(screen.getByRole('presentation'));
		expect(useSearchStore.getState().isFilterOpen).toBe(false);
	});

	it('opens when the store opens the filter after mount', () => {
		setup({ open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
		useSearchStore.getState().openFilter();
		flushSync();
		expect(screen.getByRole('dialog', { name: 'Filter Options' })).toBeInTheDocument();
	});

	it('re-renders when the draft changes after mount', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Rating' }));
		expect(screen.getByRole('button', { name: 'Rating' })).toHaveClass('bg-primary');
		expect(screen.getByRole('button', { name: 'Recommended' })).not.toHaveClass('bg-primary');
	});

	it('updates specialty, availability, price and preview count as filters toggle', async () => {
		setup();
		expect(countBadge()).toBe('2');

		await fireEvent.click(screen.getByRole('button', { name: 'Dental' }));
		expect(screen.getByRole('button', { name: 'Dental' })).toHaveClass('bg-primary');
		expect(countBadge()).toBe('1');

		await fireEvent.click(screen.getByRole('button', { name: 'Dental' }));
		expect(screen.getByRole('button', { name: 'Dental' })).not.toHaveClass('bg-primary');
		expect(countBadge()).toBe('2');

		await fireEvent.click(screen.getByRole('button', { name: 'Today' }));
		expect(screen.getByRole('button', { name: 'Today' })).toHaveClass('border-primary');
		// doc-2 (offline) drops out; doc-1 still in price range
		expect(countBadge()).toBe('1');

		await fireEvent.input(screen.getByLabelText('Maximum price'), { target: { value: '500' } });
		expect(screen.getByText('$50 - $500+')).toBeInTheDocument();
		expect(countBadge()).toBe('2');

		await fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
		expect(screen.getByText('$0 - $500+')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Today' })).not.toHaveClass('border-primary');
		expect(countBadge()).toBe('3');
	});

	it.each([
		['Show Results', /Show Results/],
		['Close', 'Close filters']
	] as const)('removes the dialog after closing via %s', async (_label, name) => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name }));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('removes the dialog after a backdrop click', async () => {
		setup();
		await fireEvent.click(screen.getByRole('presentation'));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});
