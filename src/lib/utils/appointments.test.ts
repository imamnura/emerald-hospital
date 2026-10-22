import { describe, expect, it } from 'vitest';
import {
	appointmentStatusLabel,
	appointmentStatusStyles,
	formatAppointmentListDate,
	formatCancelModalDate,
	isUpcomingAppointment
} from '#lib/utils/appointments.ts';

describe('formatCancelModalDate', () => {
	it('formats as short month, day, year', () => {
		expect(formatCancelModalDate('2023-10-17')).toBe('Oct 17, 2023');
		expect(formatCancelModalDate('2026-01-01')).toBe('Jan 1, 2026');
	});
});

describe('formatAppointmentListDate', () => {
	it('joins weekday date and 12h time with a bullet', () => {
		expect(formatAppointmentListDate('2023-10-17', '14:30')).toBe('Tue, Oct 17 • 02:30 PM');
		expect(formatAppointmentListDate('2026-10-22', '09:00')).toBe('Thu, Oct 22 • 09:00 AM');
	});
});

describe('isUpcomingAppointment', () => {
	const today = new Date(2026, 9, 22, 12, 0, 0); // local noon

	it('is true for today and future active appointments', () => {
		expect(isUpcomingAppointment('2026-10-22', 'pending', today)).toBe(true);
		expect(isUpcomingAppointment('2026-12-01', 'confirmed', today)).toBe(true);
	});

	it('is false for past dates', () => {
		expect(isUpcomingAppointment('2026-10-21', 'confirmed', today)).toBe(false);
	});

	it('is false for cancelled/completed regardless of date', () => {
		expect(isUpcomingAppointment('2030-01-01', 'cancelled', today)).toBe(false);
		expect(isUpcomingAppointment('2030-01-01', 'completed', today)).toBe(false);
	});

	it('compares against the local calendar date, not UTC', () => {
		for (const t of [new Date(2026, 9, 22, 0, 5), new Date(2026, 9, 22, 23, 55)]) {
			expect(isUpcomingAppointment('2026-10-22', 'pending', t)).toBe(true);
			expect(isUpcomingAppointment('2026-10-21', 'pending', t)).toBe(false);
		}
	});

	it('defaults today to now', () => {
		expect(isUpcomingAppointment('2999-01-01', 'pending')).toBe(true);
		expect(isUpcomingAppointment('2000-01-01', 'pending')).toBe(false);
	});
});

describe('appointmentStatusLabel', () => {
	it.each([
		['pending', 'Pending'],
		['confirmed', 'Confirmed'],
		['cancelled', 'Cancelled'],
		['completed', 'Completed'],
		['weird', 'weird']
	])('%s -> %s', (status, label) => {
		expect(appointmentStatusLabel(status)).toBe(label);
	});
});

describe('appointmentStatusStyles', () => {
	it('maps known statuses', () => {
		expect(appointmentStatusStyles('cancelled')).toBe('bg-red-50 text-error');
		expect(appointmentStatusStyles('completed')).toBe('bg-surface-container text-outline');
		expect(appointmentStatusStyles('pending')).toBe('bg-surface-container text-on-surface-variant');
		expect(appointmentStatusStyles('confirmed')).toBe('bg-surface-container text-on-surface-variant');
	});

	it('falls back for unknown statuses', () => {
		expect(appointmentStatusStyles('unknown')).toBe('bg-surface-container text-on-surface-variant');
	});
});
