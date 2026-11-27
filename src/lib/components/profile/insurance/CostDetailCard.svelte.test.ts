import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import CostDetailCard from './CostDetailCard.svelte';

describe('CostDetailCard', () => {
	it('renders label, amount and icon', () => {
		render(CostDetailCard, {
			label: 'Copay',
			amount: '$20',
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByText('Copay')).toBeInTheDocument();
		expect(screen.getByText('$20')).toBeInTheDocument();
		expect(screen.getByTestId('ic')).toBeInTheDocument();
	});
});
