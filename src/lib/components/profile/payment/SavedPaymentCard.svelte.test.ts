import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SavedPaymentCard from './SavedPaymentCard.svelte';

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
