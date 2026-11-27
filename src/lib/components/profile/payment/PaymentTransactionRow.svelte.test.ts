import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PaymentTransactionRow from './PaymentTransactionRow.svelte';

describe('PaymentTransactionRow', () => {
	it('renders title, date, card label and amount', () => {
		render(PaymentTransactionRow, {
			transaction: {
				id: 't1',
				title: 'Consultation',
				amount: '120.5',
				currency: 'USD',
				paidAt: '2024-03-05T10:00:00Z',
				cardBrand: 'visa',
				cardLast4: '4242'
			}
		});
		expect(screen.getByText('Consultation')).toBeInTheDocument();
		expect(screen.getByText(/Mar 5, 2024 • Visa \*4242/)).toBeInTheDocument();
		expect(screen.getByText('$120.50')).toBeInTheDocument();
	});

	it('falls back to Card label', () => {
		render(PaymentTransactionRow, {
			transaction: {
				id: 't2',
				title: 'Lab',
				amount: 10,
				currency: 'USD',
				paidAt: new Date('2024-01-02T12:00:00Z'),
				cardBrand: null,
				cardLast4: null
			}
		});
		expect(screen.getByText(/• Card/)).toBeInTheDocument();
		expect(screen.getByText('$10.00')).toBeInTheDocument();
	});
});
