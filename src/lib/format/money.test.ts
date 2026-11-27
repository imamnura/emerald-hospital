import { describe, expect, it } from 'vitest';
import { formatCardNumber, formatCurrency } from '#lib/format/money.ts';

describe('money', () => {
	it('masks card numbers', () => {
		expect(formatCardNumber('4242')).toBe('•••• •••• •••• 4242');
	});

	it('formats currency from numbers and strings', () => {
		expect(formatCurrency('150')).toBe('$150.00');
		expect(formatCurrency(150)).toBe('$150.00');
		expect(formatCurrency('99.5')).toBe('$99.50');
		expect(formatCurrency('12.5')).toBe('$12.50');
		expect(formatCurrency(1234.567, 'EUR')).toBe('€1,234.57');
		expect(formatCurrency(10, 'EUR')).toBe('€10.00');
	});
});
