import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { useSearchStore } from '#lib/stores/search.ts';
import { resetStores, testUser } from '../../../test/helpers-pages-public.ts';

const specialists = [
	{ id: 's1', name: 'Cardiology', slug: 'cardiology', icon: 'heart' },
	{ id: 's2', name: 'Dental', slug: 'dental', icon: null }
];
const doctors = [
	{
		id: 'd1',
		name: 'Dr. Alice',
		specialty: 'Cardiology',
		hospital: 'RSUD',
		imageUrl: null,
		rating: '4.8',
		isOnline: true,
		specialistSlug: 'cardiology'
	},
	{
		id: 'd2',
		name: 'Dr. Bob',
		specialty: 'Dental',
		hospital: 'RSUD',
		imageUrl: null,
		rating: null,
		isOnline: false,
		specialistSlug: 'dental'
	}
];

function renderPage(over: Record<string, unknown> = {}) {
	return render(Page, {
		props: {
			data: { user: testUser, specialists, doctors, activeSpecialist: 'cardiology', ...over }
		} as never
	});
}

function input() {
	return screen.getByRole('searchbox');
}

beforeEach(() => resetStores());

describe('home page', () => {
	it('renders specialists and doctors', () => {
		renderPage();
		expect(screen.getAllByText('Cardiology').length).toBeGreaterThan(0);
		expect(screen.getByText('Dr. Alice')).toBeInTheDocument();
		expect(screen.getByText('Dr. Bob')).toBeInTheDocument();
	});

	it('specialist without slug', () => {
		renderPage({ specialists: [{ id: 's3', name: 'Other', slug: null, icon: null }] });
		expect(screen.getByRole('link', { name: /Other/ })).toHaveAttribute('href', '/specialists/');
	});

	it('empty search goes to /search', async () => {
		render(Page, {
			props: { data: { user: null, specialists: [], doctors: [], activeSpecialist: '' } } as never
		});
		await fireEvent.submit(input().closest('form')!);
		expect(goto).toHaveBeenCalledWith('/search');
	});

	it('search with query sets store and navigates', async () => {
		renderPage();
		await fireEvent.input(input(), { target: { value: ' heart doc ' } });
		await fireEvent.submit(input().closest('form')!);
		expect(useSearchStore.getState().query).toBe('heart doc');
		expect(goto).toHaveBeenCalledWith(`/search?q=${encodeURIComponent('heart doc')}`);
	});

	it('filter button without query', async () => {
		renderPage();
		await fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
		expect(useSearchStore.getState().isFilterOpen).toBe(true);
		expect(goto).toHaveBeenCalledWith('/search?filter=open');
	});

	it('filter button with query', async () => {
		renderPage();
		await fireEvent.input(input(), { target: { value: 'eye' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
		expect(goto).toHaveBeenCalledWith('/search?q=eye&filter=open');
	});
});
