export function formatCardNumber(last4: string): string {
	return `•••• •••• •••• ${last4}`;
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
	const value = typeof amount === 'string' ? parseFloat(amount) : amount;
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}
