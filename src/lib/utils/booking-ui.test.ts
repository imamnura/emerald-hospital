import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	formatAppointmentDateLong,
	formatAppointmentDateShort,
	formatMonthYear,
	formatTime12h,
	generateCalendarDays,
	groupSlotsByPeriod,
	pickDefaultDate,
	toLocalDateString,
	type CalendarDay,
	type TimeSlotUi
} from '#lib/utils/booking-ui.ts';

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

describe('date formatters', () => {
	it('formats month + year', () => {
		expect(formatMonthYear('2026-10-22')).toBe('October 2026');
	});

	it('formats short appointment date', () => {
		expect(formatAppointmentDateShort('2023-10-17')).toBe('Oct 17, 2023');
	});

	it('formats long appointment date with weekday', () => {
		expect(formatAppointmentDateLong('2023-10-17')).toBe('Tuesday, Oct 17, 2023');
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

describe('generateCalendarDays', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns 14 consecutive days by default starting today', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 9, 22, 15, 0, 0)); // Thu Oct 22 2026 local
		const days = generateCalendarDays([1, 3, 5]);
		expect(days).toHaveLength(14);
		expect(days[0].dayNum).toBe(22);
		expect(days[0].dayLabel).toBe('THU');
		expect(days[1].dayLabel).toBe('FRI');
		expect(days[9].dayNum).toBe(31);
		expect(days[10].dayNum).toBe(1);
		for (const d of days) {
			expect(d.isPast).toBe(false);
			expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
		// Thu (4) not available, Fri (5) available, Mon (1) available
		expect(days[0].available).toBe(false);
		expect(days[1].available).toBe(true);
		expect(days[4].available).toBe(true);
	});

	it('uses local dates even late in the evening', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2030, 0, 5, 23, 30, 0));
		const days = generateCalendarDays([], 2);
		expect(days.map((d) => d.date)).toEqual(['2030-01-05', '2030-01-06']);
		expect(days[0].dayNum).toBe(5);
	});

	it('honours a custom count', () => {
		expect(generateCalendarDays([], 3)).toHaveLength(3);
		expect(generateCalendarDays([], 0)).toEqual([]);
		expect(generateCalendarDays([]).every((d) => !d.available)).toBe(true);
	});
});

describe('pickDefaultDate', () => {
	const day = (date: string, available: boolean, isPast = false): CalendarDay => ({
		date,
		dayLabel: 'MON',
		dayNum: 1,
		available,
		isPast
	});
	const days = [
		day('2026-01-01', true, true),
		day('2026-01-02', false),
		day('2026-01-03', true),
		day('2026-01-04', true)
	];

	it('returns the preferred date when it is available and not past', () => {
		expect(pickDefaultDate(days, '2026-01-04')).toBe('2026-01-04');
	});

	it('falls back to the first available future day when preferred is invalid', () => {
		expect(pickDefaultDate(days, '2026-01-02')).toBe('2026-01-03');
		expect(pickDefaultDate(days, '2026-01-01')).toBe('2026-01-03');
		expect(pickDefaultDate(days, '1999-01-01')).toBe('2026-01-03');
	});

	it('uses the first available day when no preference is given', () => {
		expect(pickDefaultDate(days)).toBe('2026-01-03');
	});

	it('returns empty string when nothing is available', () => {
		expect(pickDefaultDate([day('2026-01-02', false)])).toBe('');
		expect(pickDefaultDate([])).toBe('');
	});
});

describe('groupSlotsByPeriod', () => {
	const slot = (time: string, period: 'morning' | 'afternoon'): TimeSlotUi => ({
		time,
		label: time,
		quota: 1,
		scheduleId: 's',
		period,
		isFull: false
	});

	it('splits slots into morning and afternoon preserving order', () => {
		const slots = [slot('09:00', 'morning'), slot('13:00', 'afternoon'), slot('10:00', 'morning')];
		const grouped = groupSlotsByPeriod(slots);
		expect(grouped.morning.map((s) => s.time)).toEqual(['09:00', '10:00']);
		expect(grouped.afternoon.map((s) => s.time)).toEqual(['13:00']);
	});

	it('handles empty input', () => {
		expect(groupSlotsByPeriod([])).toEqual({ morning: [], afternoon: [] });
	});
});
