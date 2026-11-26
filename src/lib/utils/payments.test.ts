import { describe, expect, it } from 'vitest';
import { txPaymentLabel, type TransactionView } from '#lib/utils/payments.ts';

describe('payments', () => {
	it('labels payment method', () => {
		const tx = (cardBrand: TransactionView['cardBrand'], cardLast4: string | null): TransactionView => ({
			id: 't',
			title: 'x',
			amount: 1,
			currency: 'USD',
			paidAt: new Date(),
			cardBrand,
			cardLast4
		});
		expect(txPaymentLabel(tx('visa', '4242'))).toBe('Visa *4242');
		expect(txPaymentLabel(tx('mastercard', '5555'))).toBe('MC *5555');
		expect(txPaymentLabel(tx(null, '1111'))).toBe('Card');
		expect(txPaymentLabel(tx('visa', null))).toBe('Card');
	});
});
