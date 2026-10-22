import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { stubSpecialistsFetch } from '../test/helpers-pages-public.ts';
import { LANDING_TESTIMONIALS } from '#lib/data/landing.ts';

let hrefSetter: ReturnType<typeof vi.fn<(v: string) => void>>;
const originalLocation = window.location;

beforeEach(() => {
	stubSpecialistsFetch([]);
	hrefSetter = vi.fn<(v: string) => void>();
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: {
			get href() {
				return 'http://localhost/';
			},
			set href(v: string) {
				hrefSetter(v);
			}
		}
	});
});

afterEach(() => {
	Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
	vi.unstubAllGlobals();
});

function submit() {
	fireEvent.submit(screen.getByRole('button', { name: /search/i }).closest('form')!);
}

describe('landing page', () => {
	it('navigates to /find-doctor with no params by default', () => {
		render(Page, { props: { data: {} } as never });
		submit();
		expect(hrefSetter).toHaveBeenCalledWith('/find-doctor');
	});

	it('includes q and hospital params', async () => {
		const user = userEvent.setup();
		render(Page, { props: { data: {} } as never });
		await user.type(screen.getAllByRole('combobox')[0], '  Cardio ');
		await user.selectOptions(screen.getByRole('combobox', { name: /hospital/i }), 'rsud-purwakarta');
		submit();
		expect(hrefSetter).toHaveBeenCalledWith('/find-doctor?q=Cardio&hospital=rsud-purwakarta');
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
