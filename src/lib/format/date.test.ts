import { describe, expect, it } from 'vitest';
import {
	DAY_NAMES,
	ISO_DATE_RE,
	formatDate,
	formatTime12h,
	parseIsoDate,
	toLocalDateString
} from '#lib/format/date.ts';

describe('formatTime12h', () => {
	it.each([
		['00:00', '12:00 AM'],
		['09:05', '09:05 AM'],
		['11:59', '11:59 AM'],
		['12:00', '12:00 PM'],
		['13:30', '01:30 PM'],
		['23:45', '11:45 PM']
	])('%s -> %s', (input, expected) => {
		expect(formatTime12h(input)).toBe(expected);
	});
});

describe('toLocalDateString', () => {
	it('formats the local calendar date as YYYY-MM-DD with zero padding', () => {
		expect(toLocalDateString(new Date(2030, 0, 5))).toBe('2030-01-05');
		expect(toLocalDateString(new Date(2030, 11, 31))).toBe('2030-12-31');
	});

	it('uses the local day at both ends of the day (no UTC shift)', () => {
		expect(toLocalDateString(new Date(2030, 0, 5, 0, 0, 0))).toBe('2030-01-05');
		expect(toLocalDateString(new Date(2030, 0, 5, 23, 59, 59))).toBe('2030-01-05');
	});
});

describe('DAY_NAMES', () => {
	it('exposes Indonesian day names indexed by getDay()', () => {
		expect(DAY_NAMES).toHaveLength(7);
		expect(DAY_NAMES[0]).toBe('Minggu');
		expect(DAY_NAMES[1]).toBe('Senin');
	});
});

describe('parseIsoDate', () => {
	it('anchors YYYY-MM-DD at local noon and passes other input through', () => {
		expect(parseIsoDate('2026-10-17').getHours()).toBe(12);
		const d = new Date(2026, 2, 5, 10);
		expect(parseIsoDate(d)).toBe(d);
		expect(parseIsoDate('2026-03-05T10:00:00').getHours()).toBe(10);
	});
});

describe('formatDate', () => {
	it('short (cancel modal / confirmed modal)', () => {
		expect(formatDate('2023-10-17', 'short')).toBe('Oct 17, 2023');
		expect(formatDate('2026-01-01', 'short')).toBe('Jan 1, 2026');
	});

	it('short from Date and timestamp string (tx dates)', () => {
		expect(formatDate(new Date(2026, 2, 5, 10), 'short')).toBe('Mar 5, 2026');
		expect(formatDate('2026-03-05T10:00:00', 'short')).toBe('Mar 5, 2026');
	});

	it('monthYear', () => {
		expect(formatDate('2026-10-22', 'monthYear')).toBe('October 2026');
	});

	it('long with weekday', () => {
		expect(formatDate('2023-10-17', 'long')).toBe('Tuesday, Oct 17, 2023');
	});

	it('longId in id-ID', () => {
		const out = formatDate('2026-10-22', 'longId');
		expect(out).toContain('Kamis');
		expect(out).toContain('22');
		expect(out).toContain('Oktober');
		expect(out).toContain('2026');
	});

	it('monthYearShort from Date and string (member since)', () => {
		expect(formatDate(new Date(2024, 4, 10), 'monthYearShort')).toBe('May 2024');
		expect(formatDate('2024-05-10T12:00:00', 'monthYearShort')).toBe('May 2024');
	});

	it('dayMonth', () => {
		expect(formatDate('2026-10-24', 'dayMonth')).toBe('Oct 24');
	});

	it('weekdayDayMonth and weekdayShort', () => {
		expect(formatDate('2023-10-17', 'weekdayDayMonth')).toBe('Tue, Oct 17');
		expect(formatDate('2026-10-22', 'weekdayDayMonth')).toBe('Thu, Oct 22');
		expect(formatDate('2023-10-17', 'weekdayShort')).toBe('Tue');
	});

	it('keeps the calendar day in Asia/Jakarta and America/Los_Angeles', () => {
		const prev = process.env.TZ;
		try {
			for (const tz of ['Asia/Jakarta', 'America/Los_Angeles']) {
				process.env.TZ = tz;
				expect(formatDate('2026-10-17', 'short')).toBe('Oct 17, 2026');
				expect(formatDate('2026-10-17', 'monthYear')).toBe('October 2026');
			}
		} finally {
			if (prev === undefined) delete process.env.TZ;
			else process.env.TZ = prev;
		}
	});
});

describe('ISO_DATE_RE', () => {
	it('matches only YYYY-MM-DD', () => {
		expect(ISO_DATE_RE.test('2024-01-31')).toBe(true);
		expect(ISO_DATE_RE.test('2024-1-31')).toBe(false);
	});
});
