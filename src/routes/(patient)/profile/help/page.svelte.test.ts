import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { mockLocationHref } from '../../../../test/helpers-pages-public.ts';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '#lib/data/help-support.ts';

let loc: ReturnType<typeof mockLocationHref>;
beforeEach(() => {
	loc = mockLocationHref();
});
afterEach(() => {
	loc.restore();
	vi.useRealTimers();
});

function renderPage() {
	return render(Page, { props: { data: {} } as never });
}

describe('help page', () => {
	it('contact actions: faqs scroll, call, email', async () => {
		renderPage();
		const scroll = vi.fn();
		document.getElementById('popular-faqs')!.scrollIntoView = scroll;
		await fireEvent.click(screen.getByRole('button', { name: /FAQs Browse/ }));
		expect(scroll).toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: /Call Center/ }));
		expect(loc.setHref).toHaveBeenCalledWith(`tel:${SUPPORT_PHONE}`);
		await fireEvent.click(screen.getByRole('button', { name: /Email Us/ }));
		expect(loc.setHref).toHaveBeenCalledWith(
			`mailto:${SUPPORT_EMAIL}?subject=Emerald%20Hospital%20Support`
		);
	});

	it('live chat shows a notice that auto-hides', async () => {
		vi.useFakeTimers();
		renderPage();
		await fireEvent.click(screen.getByRole('button', { name: /Live Chat/ }));
		expect(screen.getByText(/Live chat is not available yet/)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Live Chat/ }));
		vi.advanceTimersByTime(5000);
		vi.useRealTimers();
		await waitFor(() => expect(screen.queryByText(/Live chat is not available yet/)).toBeNull());
	});

	it('filters FAQs and toggles answer', async () => {
		renderPage();
		const search = screen.getByPlaceholderText('Search for help or FAQs...');
		await fireEvent.input(search, { target: { value: 'insurance' } });
		const btn = screen.getByRole('button', { name: /What insurance plans/ });
		expect(screen.queryByText(/How do I reschedule/)).toBeNull();
		await fireEvent.click(btn);
		expect(btn).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('call support')).toBeInTheDocument();
		await fireEvent.click(btn);
		expect(btn).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.input(search, { target: { value: 'zzzz' } });
		expect(await screen.findByText('No FAQs match your search.')).toBeInTheDocument();
	});
});
