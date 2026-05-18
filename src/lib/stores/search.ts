import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DoctorSearchResult = {
	id: string;
	name: string;
	specialty: string;
	hospital: string;
	imageUrl: string | null;
	rating: string;
	reviewCount: number;
	specialistSlug: string;
	isOnline: boolean;
};

export type SortBy = 'recommended' | 'rating' | 'distance';
export type Availability = 'today' | 'week' | null;

export type SearchFilters = {
	sortBy: SortBy;
	specialties: string[];
	availability: Availability;
	priceRange: [number, number];
};

export const defaultSearchFilters: SearchFilters = {
	sortBy: 'recommended',
	specialties: [],
	availability: null,
	priceRange: [50, 250]
};

type SearchState = {
	query: string;
	results: DoctorSearchResult[];
	filters: SearchFilters;
	draftFilters: SearchFilters;
	isFilterOpen: boolean;
	bookmarkedIds: string[];
	setQuery: (query: string) => void;
	setResults: (results: DoctorSearchResult[]) => void;
	openFilter: () => void;
	closeFilter: () => void;
	applyFilters: () => void;
	setDraftFilters: (filters: SearchFilters) => void;
	updateDraftFilters: (partial: Partial<SearchFilters>) => void;
	clearAllFilters: () => void;
	toggleBookmark: (id: string) => void;
	isBookmarked: (id: string) => boolean;
	clearQuery: () => void;
	reset: () => void;
};

const storage = createJSONStorage<Pick<SearchState, 'bookmarkedIds' | 'filters'>>(() =>
	typeof window !== 'undefined'
		? localStorage
		: {
				getItem: () => null,
				setItem: () => {},
				removeItem: () => {}
			}
);

export const useSearchStore = createStore<SearchState>()(
	persist(
		(set, get) => ({
			query: '',
			results: [],
			filters: { ...defaultSearchFilters },
			draftFilters: { ...defaultSearchFilters },
			isFilterOpen: false,
			bookmarkedIds: [],

			setQuery: (query) => set({ query }),
			setResults: (results) => set({ results }),
			openFilter: () =>
				set({
					isFilterOpen: true,
					draftFilters: { ...get().filters, specialties: [...get().filters.specialties] }
				}),
			closeFilter: () => set({ isFilterOpen: false }),
			applyFilters: () =>
				set({
					filters: {
						...get().draftFilters,
						specialties: [...get().draftFilters.specialties],
						priceRange: [...get().draftFilters.priceRange] as [number, number]
					},
					isFilterOpen: false
				}),
			setDraftFilters: (draftFilters) => set({ draftFilters }),
			updateDraftFilters: (partial) =>
				set({
					draftFilters: {
						...get().draftFilters,
						...partial,
						specialties: partial.specialties
							? [...partial.specialties]
							: get().draftFilters.specialties,
						priceRange: partial.priceRange
							? ([...partial.priceRange] as [number, number])
							: get().draftFilters.priceRange
					}
				}),
			clearAllFilters: () => {
				const cleared = {
					...defaultSearchFilters,
					specialties: [],
					priceRange: [0, 500] as [number, number]
				};
				set({ filters: cleared, draftFilters: cleared });
			},
			toggleBookmark: (id) =>
				set((s) => ({
					bookmarkedIds: s.bookmarkedIds.includes(id)
						? s.bookmarkedIds.filter((x) => x !== id)
						: [...s.bookmarkedIds, id]
				})),
			isBookmarked: (id) => get().bookmarkedIds.includes(id),
			clearQuery: () => set({ query: '' }),
			reset: () =>
				set({
					query: '',
					results: [],
					filters: { ...defaultSearchFilters },
					draftFilters: { ...defaultSearchFilters },
					isFilterOpen: false
				})
		}),
		{
			name: 'emerald-search',
			storage,
			partialize: (state) => ({
				bookmarkedIds: state.bookmarkedIds,
				filters: state.filters
			})
		}
	)
);

/** Mock consultation price from doctor id for price-range filter */
export function doctorPrice(id: string): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash + id.charCodeAt(i) * 17) % 450;
	}
	return 50 + hash;
}

export function filterAndSortDoctors(
	results: DoctorSearchResult[],
	query: string,
	filters: SearchFilters
): DoctorSearchResult[] {
	let list = [...results];

	const q = query.trim().toLowerCase();
	if (q) {
		list = list.filter(
			(d) =>
				d.name.toLowerCase().includes(q) ||
				d.specialty.toLowerCase().includes(q) ||
				d.hospital.toLowerCase().includes(q)
		);
	}

	if (filters.specialties.length > 0) {
		list = list.filter((d) => filters.specialties.includes(d.specialistSlug));
	}

	const [minPrice, maxPrice] = filters.priceRange;
	list = list.filter((d) => {
		const price = doctorPrice(d.id);
		const cap = maxPrice >= 500 ? Infinity : maxPrice;
		return price >= minPrice && price <= cap;
	});

	if (filters.availability === 'today') {
		list = list.filter((d) => d.isOnline);
	}

	switch (filters.sortBy) {
		case 'rating':
			list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
			break;
		case 'distance':
			list.sort((a, b) => a.hospital.localeCompare(b.hospital));
			break;
		default:
			list.sort((a, b) => b.reviewCount - a.reviewCount);
	}

	return list;
}

