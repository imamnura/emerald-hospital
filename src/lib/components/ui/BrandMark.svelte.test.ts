import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BrandMark from './BrandMark.svelte';

describe('BrandMark', () => {
	it('renders the brand name', () => {
		render(BrandMark);
		expect(screen.getByText('Purwakarta Health')).toBeInTheDocument();
	});

	it('uses a bolder icon stroke for md than sm', () => {
		const md = render(BrandMark, { size: 'md' });
		expect(md.container.querySelector('svg')).toHaveAttribute('stroke-width', '2.5');
		const sm = render(BrandMark, { size: 'sm' });
		expect(sm.container.querySelector('svg')).toHaveAttribute('stroke-width', '2');
	});
});
