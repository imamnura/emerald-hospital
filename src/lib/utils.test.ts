import { describe, expect, it } from 'vitest';
import { cn, DAY_NAMES, formatDateId, statusColor, statusLabel } from '#lib/utils.ts';

describe('lib/utils', () => {
	it('exposes Indonesian day names indexed by getDay()', () => {
		expect(DAY_NAMES).toHaveLength(7);
		expect(DAY_NAMES[0]).toBe('Minggu');
		expect(DAY_NAMES[1]).toBe('Senin');
	});

	it('formats a date in id-ID long form', () => {
		const out = formatDateId('2026-10-22');
		expect(out).toContain('Kamis');
		expect(out).toContain('22');
		expect(out).toContain('Oktober');
		expect(out).toContain('2026');
	});

	it.each([
		['pending', 'Menunggu'],
		['confirmed', 'Dikonfirmasi'],
		['cancelled', 'Dibatalkan'],
		['completed', 'Selesai'],
		['other', 'other']
	])('statusLabel(%s) = %s', (s, label) => {
		expect(statusLabel(s)).toBe(label);
	});

	it('maps status colors with a fallback', () => {
		expect(statusColor('pending')).toBe('bg-amber-100 text-amber-800');
		expect(statusColor('confirmed')).toBe('bg-primary/15 text-primary');
		expect(statusColor('cancelled')).toBe('bg-red-100 text-red-800');
		expect(statusColor('completed')).toBe('bg-surface-container text-on-surface-variant');
		expect(statusColor('nope')).toBe('bg-surface-container text-on-surface-variant');
	});

	it('cn joins truthy class names', () => {
		expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
		expect(cn()).toBe('');
	});
});
