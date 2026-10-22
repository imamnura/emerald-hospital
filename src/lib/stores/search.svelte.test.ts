import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	defaultSearchFilters,
	doctorPrice,
	filterAndSortDoctors,
	useSearchStore,
	type DoctorSearchResult,
	type SearchFilters
} from '#lib/stores/search.ts';

const KEY = 'emerald-search';
const s = () => useSearchStore.getState();

const doc = (over: Partial<DoctorSearchResult>): DoctorSearchResult => ({
	id: 'd',
	name: 'Dr. X',
	specialty: 'Cardiology',
	hospital: 'Emerald',
	imageUrl: null,
	rating: '4.5',
	reviewCount: 10,
	specialistSlug: 'cardiology',
	isOnline: false,
	...over
});

describe('useSearchStore', () => {
	beforeEach(() => {
		s().reset();
		useSearchStore.setState({ bookmarkedIds: [] });
		localStorage.clear();
	});

	it('starts with default state', () => {
		expect(s().query).toBe('');
		expect(s().results).toEqual([]);
		expect(s().filters).toEqual(defaultSearchFilters);
		expect(s().draftFilters).toEqual(defaultSearchFilters);
		expect(s().isFilterOpen).toBe(false);
	});

	it('sets and clears the query and results', () => {
		s().setQuery('heart');
		expect(s().query).toBe('heart');
		s().clearQuery();
		expect(s().query).toBe('');
		const results = [doc({ id: 'a' })];
		s().setResults(results);
		expect(s().results).toBe(results);
	});

	it('openFilter copies applied filters into a detached draft', () => {
		useSearchStore.setState({ filters: { ...defaultSearchFilters, specialties: ['dental'] } });
		s().openFilter();
		expect(s().isFilterOpen).toBe(true);
		expect(s().draftFilters.specialties).toEqual(['dental']);
		s().draftFilters.specialties.push('mutated');
		expect(s().filters.specialties).toEqual(['dental']);
		s().closeFilter();
		expect(s().isFilterOpen).toBe(false);
	});

	it('updateDraftFilters merges partial values and copies arrays', () => {
		const specialties = ['eye'];
		const priceRange: [number, number] = [100, 200];
		s().updateDraftFilters({ sortBy: 'rating', specialties, priceRange });
		expect(s().draftFilters).toEqual({ ...defaultSearchFilters, sortBy: 'rating', specialties: ['eye'], priceRange: [100, 200] });
		expect(s().draftFilters.specialties).not.toBe(specialties);
		expect(s().draftFilters.priceRange).not.toBe(priceRange);

		// partial without arrays keeps the previous arrays
		s().updateDraftFilters({ availability: 'today' });
		expect(s().draftFilters.specialties).toEqual(['eye']);
		expect(s().draftFilters.priceRange).toEqual([100, 200]);
		expect(s().draftFilters.availability).toBe('today');
		// not applied yet
		expect(s().filters).toEqual(defaultSearchFilters);
	});

	it('applyFilters commits a copy of the draft and closes the sheet', () => {
		s().openFilter();
		const draft: SearchFilters = { sortBy: 'distance', specialties: ['ent'], availability: 'week', priceRange: [60, 90] };
		s().setDraftFilters(draft);
		expect(s().draftFilters).toBe(draft);
		s().applyFilters();
		expect(s().isFilterOpen).toBe(false);
		expect(s().filters).toEqual(draft);
		expect(s().filters.specialties).not.toBe(draft.specialties);
		expect(s().filters.priceRange).not.toBe(draft.priceRange);
	});

	it('clearAllFilters resets filters and draft to the widest price range', () => {
		s().updateDraftFilters({ specialties: ['x'], sortBy: 'rating' });
		s().applyFilters();
		s().clearAllFilters();
		const expected = { ...defaultSearchFilters, priceRange: [0, 500] };
		expect(s().filters).toEqual(expected);
		expect(s().draftFilters).toEqual(expected);
	});

	it('toggles bookmarks and reports bookmark state', () => {
		s().toggleBookmark('a');
		s().toggleBookmark('b');
		expect(s().bookmarkedIds).toEqual(['a', 'b']);
		expect(s().isBookmarked('a')).toBe(true);
		s().toggleBookmark('a');
		expect(s().bookmarkedIds).toEqual(['b']);
		expect(s().isBookmarked('a')).toBe(false);
	});

	it('reset clears query/results/filters but keeps bookmarks', () => {
		s().toggleBookmark('keep');
		s().setQuery('q');
		s().setResults([doc({})]);
		s().openFilter();
		s().reset();
		expect(s().query).toBe('');
		expect(s().results).toEqual([]);
		expect(s().isFilterOpen).toBe(false);
		expect(s().bookmarkedIds).toEqual(['keep']);
	});

	it("persists only bookmarks and filters under 'emerald-search'", () => {
		s().setQuery('not persisted');
		s().toggleBookmark('doc-1');
		const raw = localStorage.getItem(KEY);
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!);
		expect(Object.keys(parsed.state).sort()).toEqual(['bookmarkedIds', 'filters']);
		expect(parsed.state.bookmarkedIds).toEqual(['doc-1']);
		expect(parsed.state.query).toBeUndefined();
	});

	it('rehydrates bookmarks and filters from localStorage', async () => {
		localStorage.setItem(
			KEY,
			JSON.stringify({
				state: { bookmarkedIds: ['x', 'y'], filters: { ...defaultSearchFilters, sortBy: 'rating' } },
				version: 0
			})
		);
		await useSearchStore.persist.rehydrate();
		expect(s().bookmarkedIds).toEqual(['x', 'y']);
		expect(s().filters.sortBy).toBe('rating');
	});

	it('hydrates on module load from existing storage', async () => {
		localStorage.setItem(KEY, JSON.stringify({ state: { bookmarkedIds: ['boot'], filters: defaultSearchFilters }, version: 0 }));
		vi.resetModules();
		const mod = await import('#lib/stores/search.ts');
		expect(mod.useSearchStore.getState().bookmarkedIds).toEqual(['boot']);
		mod.useSearchStore.persist.clearStorage();
		expect(localStorage.getItem(KEY)).toBeNull();
	});
});

describe('doctorPrice', () => {
	it('is deterministic and within [50, 499]', () => {
		for (const id of ['', 'a', 'abc', 'doctor-123', 'x'.repeat(100)]) {
			const p = doctorPrice(id);
			expect(p).toBe(doctorPrice(id));
			expect(p).toBeGreaterThanOrEqual(50);
			expect(p).toBeLessThan(500);
		}
		expect(doctorPrice('')).toBe(50);
		expect(doctorPrice('a')).toBe(50 + ((97 * 17) % 450));
	});
});

describe('filterAndSortDoctors', () => {
	const wide: SearchFilters = { ...defaultSearchFilters, priceRange: [0, 500] };
	const a = doc({ id: 'a', name: 'Alice', specialty: 'Cardiology', hospital: 'Zeta', rating: '4.1', reviewCount: 5, specialistSlug: 'cardiology', isOnline: true });
	const b = doc({ id: 'b', name: 'Bob', specialty: 'Dental', hospital: 'Alpha', rating: '4.9', reviewCount: 50, specialistSlug: 'dental' });
	const c = doc({ id: 'c', name: 'Carol', specialty: 'Eye Care', hospital: 'Mid Hospital', rating: '4.5', reviewCount: 20, specialistSlug: 'eye-care', isOnline: true });
	const all = [a, b, c];

	it('does not mutate the input and sorts by review count by default', () => {
		const input = [...all];
		const out = filterAndSortDoctors(input, '', wide);
		expect(out.map((d) => d.id)).toEqual(['b', 'c', 'a']);
		expect(input).toEqual(all);
	});

	it('filters by query across name, specialty and hospital', () => {
		expect(filterAndSortDoctors(all, '  ALICE ', wide).map((d) => d.id)).toEqual(['a']);
		expect(filterAndSortDoctors(all, 'dental', wide).map((d) => d.id)).toEqual(['b']);
		expect(filterAndSortDoctors(all, 'mid hosp', wide).map((d) => d.id)).toEqual(['c']);
		expect(filterAndSortDoctors(all, 'zzz', wide)).toEqual([]);
	});

	it('filters by specialties', () => {
		expect(filterAndSortDoctors(all, '', { ...wide, specialties: ['dental', 'eye-care'] }).map((d) => d.id)).toEqual(['b', 'c']);
	});

	it('filters by price range; max >= 500 means no upper cap', () => {
		const prices = Object.fromEntries(all.map((d) => [d.id, doctorPrice(d.id)]));
		const exact = filterAndSortDoctors(all, '', { ...wide, priceRange: [prices.a, prices.a] });
		expect(exact.map((d) => d.id)).toContain('a');
		for (const d of exact) expect(doctorPrice(d.id)).toBe(prices.a);
		expect(filterAndSortDoctors(all, '', { ...wide, priceRange: [0, 49] })).toEqual([]);
		expect(filterAndSortDoctors(all, '', { ...wide, priceRange: [0, 10_000] })).toHaveLength(3);
		expect(filterAndSortDoctors(all, '', { ...wide, priceRange: [0, 500] })).toHaveLength(3);
	});

	it("availability 'today' keeps only online doctors; 'week' keeps all", () => {
		expect(filterAndSortDoctors(all, '', { ...wide, availability: 'today' }).map((d) => d.id).sort()).toEqual(['a', 'c']);
		expect(filterAndSortDoctors(all, '', { ...wide, availability: 'week' })).toHaveLength(3);
	});

	it('sorts by rating desc and by hospital name for distance', () => {
		expect(filterAndSortDoctors(all, '', { ...wide, sortBy: 'rating' }).map((d) => d.id)).toEqual(['b', 'c', 'a']);
		expect(filterAndSortDoctors(all, '', { ...wide, sortBy: 'distance' }).map((d) => d.id)).toEqual(['b', 'c', 'a']);
	});
});
