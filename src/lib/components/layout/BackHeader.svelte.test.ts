import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import BackHeader from './BackHeader.svelte';

describe('BackHeader', () => {
	it('renders the back link, title and a spacer without trailing', () => {
		const { container } = render(BackHeader, { title: 'Help', backHref: '/profile' });
		expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/profile');
		expect(screen.getByRole('heading', { name: 'Help' })).toBeInTheDocument();
		expect(container.querySelector('[aria-hidden="true"].w-10')).toBeInTheDocument();
	});

	it('renders the trailing snippet instead of the spacer', () => {
		const { container } = render(BackHeader, {
			title: 'Search',
			backHref: '/x',
			trailing: snip('<a href="/profile">G</a>')
		});
		expect(screen.getByRole('link', { name: 'G' })).toHaveAttribute('href', '/profile');
		expect(container.querySelector('.w-10[aria-hidden="true"]')).toBeNull();
	});

	it('renders the divider only when asked', () => {
		const off = render(BackHeader, { title: 'A', backHref: '/' });
		expect(off.container.querySelector('.border-b')).toBeNull();
		off.unmount();
		const on = render(BackHeader, { title: 'A', backHref: '/', divider: true, dividerClass: 'mb-4' });
		const rule = on.container.querySelector('.border-b');
		expect(rule).toHaveClass('-mt-1', 'mb-4', 'border-outline-variant/30');
		expect(rule).toHaveAttribute('aria-hidden', 'true');
	});
});
