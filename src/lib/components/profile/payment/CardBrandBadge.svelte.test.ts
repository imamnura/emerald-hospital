import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CardBrandBadge from './CardBrandBadge.svelte';

describe('CardBrandBadge', () => {
	it('renders VISA', () => {
		render(CardBrandBadge, { brand: 'visa' });
		expect(screen.getByText('VISA')).toBeInTheDocument();
	});
	it('renders Mastercard', () => {
		render(CardBrandBadge, { brand: 'mastercard' });
		expect(screen.getByLabelText('Mastercard')).toBeInTheDocument();
		expect(screen.queryByText('VISA')).toBeNull();
	});
});
