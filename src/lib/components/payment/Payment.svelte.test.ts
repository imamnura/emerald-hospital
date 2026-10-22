import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CardBrandBadge from './CardBrandBadge.svelte';
import PaymentTransactionRow from './PaymentTransactionRow.svelte';
import SavedPaymentCard from './SavedPaymentCard.svelte';

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

describe('SavedPaymentCard', () => {
	const base = { id: 'c1', brand: 'visa' as const, last4: '1111', expires: '12/28' };

	it('renders default card without delete button', async () => {
		const onSetDefault = vi.fn();
		render(SavedPaymentCard, { card: { ...base, isDefault: true }, onSetDefault });
		expect(screen.getByText('Default')).toBeInTheDocument();
		expect(screen.getByText('•••• •••• •••• 1111')).toBeInTheDocument();
		expect(screen.getByText('Expires 12/28')).toBeInTheDocument();
		expect(screen.queryByLabelText('Remove card')).toBeNull();
		const btn = screen.getByRole('button');
		expect(btn).toBeDisabled();
		await fireEvent.click(btn);
		expect(onSetDefault).not.toHaveBeenCalled();
	});

	it('calls onSetDefault and onDelete for non-default card', async () => {
		const onSetDefault = vi.fn();
		const onDelete = vi.fn();
		render(SavedPaymentCard, {
			card: { ...base, brand: 'mastercard', isDefault: false },
			onSetDefault,
			onDelete
		});
		expect(screen.queryByText('Default')).toBeNull();
		expect(screen.getByLabelText('Mastercard')).toBeInTheDocument();
		await fireEvent.click(screen.getByText('•••• •••• •••• 1111'));
		expect(onSetDefault).toHaveBeenCalledTimes(1);
		await fireEvent.click(screen.getByLabelText('Remove card'));
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('tolerates missing callbacks', async () => {
		render(SavedPaymentCard, { card: { ...base, isDefault: false } });
		await fireEvent.click(screen.getByText('•••• •••• •••• 1111'));
		await fireEvent.click(screen.getByLabelText('Remove card'));
		expect(screen.getByLabelText('Remove card')).toBeInTheDocument();
	});
});
