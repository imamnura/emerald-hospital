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

export function formatCardNumber(last4: string): string {
	return `•••• •••• •••• ${last4}`;
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
	const value = typeof amount === 'string' ? parseFloat(amount) : amount;
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatTxDate(value: Date | string): string {
	const d = typeof value === 'string' ? new Date(value) : value;
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function txPaymentLabel(tx: TransactionView): string {
	if (!tx.cardBrand || !tx.cardLast4) return 'Card';
	const brandLabel = tx.cardBrand === 'visa' ? 'Visa' : 'MC';
	return `${brandLabel} *${tx.cardLast4}`;
}
