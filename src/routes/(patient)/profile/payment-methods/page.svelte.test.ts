import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions, update } from '../../../../test/mocks/app-forms.ts';

const cards = [
	{ id: 'c1', brand: 'visa', last4: '1111', expires: '12/30', isDefault: true },
	{ id: 'c2', brand: 'mastercard', last4: '2222', expires: '01/29', isDefault: false }
];
const transactions = [
	{
		id: 't1',
		title: 'Consultation',
		amount: '50.00',
		currency: 'USD',
		paidAt: '2024-05-01T00:00:00Z',
		cardBrand: 'visa',
		cardLast4: '1111'
	}
];

describe('payment methods page', () => {
	it('empty lists, add form open/cancel', async () => {
		render(Page, { props: { data: { savedCards: [], transactions: [] }, form: null } as never });
		expect(screen.getByText('No transactions yet.')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Add New Payment Method/ }));
		expect(screen.getByRole('button', { name: 'Save Card' })).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.getByRole('button', { name: /Add New Payment Method/ })).toBeInTheDocument();
	});

	it('add form submits and closes', async () => {
		render(Page, { props: { data: { savedCards: [], transactions: [] }, form: null } as never });
		await fireEvent.click(screen.getByRole('button', { name: /Add New Payment Method/ }));
		await fireEvent.submit(screen.getByRole('button', { name: 'Save Card' }).closest('form')!);
		expect(submissions[0].action.search).toBe('?/add');
		expect(update).toHaveBeenCalledWith({ reset: true });
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /Add New Payment Method/ })).toBeInTheDocument()
		);
	});

	it('set default and delete submit hidden forms; shows error and transactions', async () => {
		render(Page, {
			props: { data: { savedCards: cards, transactions }, form: { error: 'Missing card id.' } } as never
		});
		expect(screen.getByText('Missing card id.')).toBeInTheDocument();
		expect(screen.getByText('Consultation')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /2222/ }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].action.search).toBe('?/setDefault');
		expect(submissions[0].formData.get('cardId')).toBe('c2');
		await fireEvent.click(screen.getByRole('button', { name: 'Remove card' }));
		await waitFor(() => expect(submissions).toHaveLength(2));
		expect(submissions[1].action.search).toBe('?/delete');
		expect(submissions[1].formData.get('cardId')).toBe('c2');
	});

	it('delete posts the correct cardId on the first click', async () => {
		render(Page, { props: { data: { savedCards: cards, transactions }, form: null } as never });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove card' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].action.search).toBe('?/delete');
		expect(submissions[0].formData.get('cardId')).toBe('c2');
	});
});
