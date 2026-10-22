import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { goto } from '../../test/mocks/app-navigation.ts';
import { stubSpecialistsFetch, testUser } from '../../test/helpers-pages-public.ts';

const doctor = (over: Record<string, unknown> = {}) => ({
	id: 'd1',
	name: 'Dr. Alice',
	specialty: 'Cardiology',
	hospital: 'RSUD Purwakarta',
	imageUrl: 'https://img/a.png',
	rating: '4.8',
	reviewCount: 12,
	specialistSlug: 'cardiology',
	isOnline: true,
	...over
});

function data(over: Record<string, unknown> = {}) {
	return { user: null, query: '', hospital: 'all', doctors: [], hospitals: [], ...over };
}

beforeEach(() => {
	stubSpecialistsFetch([]);
});
afterEach(() => {
	vi.unstubAllGlobals();
});

function submit() {
	fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
}

describe('find-doctor page', () => {
	it('renders empty state and searches with no params', () => {
		render(Page, { props: { data: data() } as never });
		expect(screen.getByText('All available specialist doctors')).toBeInTheDocument();
		expect(screen.getByText(/No doctors match/)).toBeInTheDocument();
		expect(screen.getByText(/doctors found/)).toBeInTheDocument();
		submit();
		expect(goto).toHaveBeenCalledWith('/find-doctor', { reset: false });
	});

	it('renders results for a guest with login redirect links', () => {
		render(Page, {
			props: {
				data: data({
					query: 'Cardio',
					doctors: [doctor(), doctor({ id: 'd2', name: 'Bob', imageUrl: null })]
				})
			} as never
		});
		expect(screen.getByText('"Cardio"')).toBeInTheDocument();
		expect(screen.getByText(/doctors found/)).toBeInTheDocument();
		expect(screen.getByAltText('Dr. Alice')).toBeInTheDocument();
		expect(screen.getByText('B')).toBeInTheDocument();
		const links = screen.getAllByRole('link', { name: 'Book Now' });
		expect(links[0]).toHaveAttribute(
			'href',
			`/login?redirect=${encodeURIComponent('/doctors/d1/book')}`
		);
	});

	it('logged-in user gets direct book links, singular wording, search with params', async () => {
		const user = userEvent.setup();
		render(Page, {
			props: {
				data: data({ user: testUser, hospital: 'rsud-purwakarta', doctors: [doctor()] })
			} as never
		});
		expect(screen.getByText(/doctor found/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute(
			'href',
			'/doctors/d1/book'
		);
		await user.type(screen.getAllByRole('combobox')[0], 'Neuro');
		submit();
		expect(goto).toHaveBeenCalledWith('/find-doctor?q=Neuro&hospital=rsud-purwakarta', {
			reset: false
		});
	});

	it('falls back to all when hospital is empty', () => {
		render(Page, { props: { data: data({ hospital: '' }) } as never });
		const select = screen.getByRole('combobox', { name: /hospital/i }) as HTMLSelectElement;
		expect(select.value).toBe('all');
	});
});
