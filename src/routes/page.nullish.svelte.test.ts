import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Landing from './+page.svelte';
import FindDoctor from './find-doctor/+page.svelte';
import { mockLocationHref, stubSpecialistsFetch } from '#test/helpers/component.ts';

/*
 * The compiled template emits `value ?? ''` for every `{expr}` interpolation.
 * Landing content is constant, so these fallbacks are exercised by mocking the
 * data module with missing (undefined) text fields.
 */
vi.mock('#lib/data/landing.ts', async (importOriginal) => {
	const real = await importOriginal<typeof import('#lib/data/landing.ts')>();
	const blank = <T extends object>(o: T) =>
		Object.fromEntries(
			Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? undefined : v])
		) as T;
	return {
		...real,
		LANDING_BRAND: blank(real.LANDING_BRAND),
		LANDING_HERO: blank(real.LANDING_HERO),
		LANDING_HOSPITALS: real.LANDING_HOSPITALS.map((h) => ({ value: h.value, label: undefined })),
		LANDING_TRUST_BADGES: real.LANDING_TRUST_BADGES.map((b) => ({ id: b.id, label: undefined })),
		LANDING_POPULAR_DOCTORS: {
			...blank(real.LANDING_POPULAR_DOCTORS),
			doctors: real.LANDING_POPULAR_DOCTORS.doctors.map((d) => ({ ...d, reviewCount: undefined }))
		},
		LANDING_TESTIMONIALS: {
			...real.LANDING_TESTIMONIALS,
			appReviews: real.LANDING_TESTIMONIALS.appReviews.map((r) => ({
				...r,
				author: undefined,
				location: undefined
			}))
		},
		LANDING_FOOTER: {
			...real.LANDING_FOOTER,
			developmentCenter: { ...real.LANDING_FOOTER.developmentCenter, address: undefined },
			support: blank(real.LANDING_FOOTER.support)
		}
	};
});

let loc: ReturnType<typeof mockLocationHref>;
beforeEach(() => {
	stubSpecialistsFetch([]);
	loc = mockLocationHref();
});
afterEach(() => {
	loc.restore();
	vi.unstubAllGlobals();
});

describe('landing + find-doctor with missing content fields', () => {
	it('landing renders without crashing', () => {
		const Page = Landing;
		render(Page, { props: { data: {} } as never });
		expect(screen.getAllByRole('link', { name: 'Book Now' }).length).toBeGreaterThan(0);
	});

	it('find-doctor renders without crashing', () => {
		const Page = FindDoctor;
		render(Page, {
			props: {
				data: {
					user: null,
					query: '',
					hospital: 'all',
					hospitals: [],
					doctors: [
						{
							id: 'd1',
							name: 'Dr. A',
							specialty: 'Cardiology',
							hospital: 'RSUD',
							imageUrl: null,
							rating: '4.5',
							reviewCount: null
						}
					]
				}
			} as never
		});
		expect(screen.getByRole('link', { name: 'Book Now' })).toBeInTheDocument();
	});
});
