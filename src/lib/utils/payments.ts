export type CardBrand = 'visa' | 'mastercard';

export type SavedCardView = {
	id: string;
	brand: CardBrand;
	last4: string;
	expires: string;
	isDefault: boolean;
};

export type TransactionView = {
	id: string;
	title: string;
	amount: string | number;
	currency: string;
	paidAt: Date | string;
	cardBrand: CardBrand | null;
	cardLast4: string | null;
};

export function txPaymentLabel(tx: TransactionView): string {
	if (!tx.cardBrand || !tx.cardLast4) return 'Card';
	const brandLabel = tx.cardBrand === 'visa' ? 'Visa' : 'MC';
	return `${brandLabel} *${tx.cardLast4}`;
}
