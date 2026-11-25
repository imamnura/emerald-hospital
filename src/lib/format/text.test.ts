import { describe, expect, it } from 'vitest';
import { getInitials } from '#lib/format/text.ts';

describe('getInitials', () => {
	it('takes up to two uppercase initials', () => {
		expect(getInitials('Siti Nurhaliza Putri')).toBe('SN');
		expect(getInitials('budi')).toBe('B');
	});

	it('returns empty string for empty, null and undefined', () => {
		expect(getInitials('')).toBe('');
		expect(getInitials(null)).toBe('');
		expect(getInitials(undefined)).toBe('');
	});
});
