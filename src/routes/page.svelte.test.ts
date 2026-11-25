import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { goto } from '../test/mocks/app-navigation.ts';
import { stubSpecialistsFetch } from '../test/helpers-pages-public.ts';
import { LANDING_TESTIMONIALS } from '#lib/data/landing.ts';

beforeEach(() => {
	stubSpecialistsFetch([]);
	goto.mockClear();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function submit() {
	fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
}

describe('landing page', () => {
	it('navigates to /find-doctor with no params by default', () => {
		render(Page, { props: { data: {} } as never });
		submit();
		expect(goto).toHaveBeenCalledWith('/find-doctor');
	});

	it('includes q and hospital params', async () => {
		const user = userEvent.setup();
		render(Page, { props: { data: {} } as never });
		await user.type(screen.getAllByRole('combobox')[0], '  Cardio ');
		await user.selectOptions(screen.getByRole('combobox', { name: /hospital/i }), 'rsud-purwakarta');
		submit();
		expect(goto).toHaveBeenCalledWith('/find-doctor?q=Cardio&hospital=rsud-purwakarta');
	});

	it('switches testimonial tabs', async () => {
		render(Page, { props: { data: {} } as never });
		const appText = LANDING_TESTIMONIALS.appReviews[0].text;
		const docText = LANDING_TESTIMONIALS.doctorReviews[0].text;
		expect(screen.getByText(appText)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Doctor Reviews' }));
		expect(screen.getByText(docText)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'App Reviews' }));
		expect(screen.getByText(appText)).toBeInTheDocument();
	});
});
