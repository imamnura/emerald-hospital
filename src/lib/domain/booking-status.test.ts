import { describe, expect, it } from 'vitest';
import { bookingStatusEnum } from '#lib/server/db/schema.ts';
import {
	BOOKING_STATUSES,
	STATUS_CLASS,
	STATUS_HEX,
	STATUS_LABEL,
	getStatusClass,
	getStatusLabel,
	isBookingStatus
} from '#lib/domain/booking-status.ts';

describe('booking-status', () => {
	it('BOOKING_STATUSES mirrors the DB enum', () =>
		expect(BOOKING_STATUSES).toEqual(bookingStatusEnum.enumValues));

	it('labels', () => {
		expect(STATUS_LABEL.cancelled).toBe('Cancelled');
		expect(STATUS_LABEL.pending).toBe('Pending');
		expect(STATUS_LABEL.confirmed).toBe('Confirmed');
		expect(STATUS_LABEL.completed).toBe('Completed');
	});

	it('class variants keep current values', () => {
		expect(STATUS_CLASS.badge.confirmed).toBe('bg-primary/15 text-primary');
		expect(STATUS_CLASS.pill.cancelled).toBe('bg-red-50 text-error ring-red-200');
		expect(STATUS_CLASS.appointment.cancelled).toBe('bg-red-50 text-error');
		expect(STATUS_CLASS.appointment.completed).toBe('bg-surface-container text-outline');
		expect(STATUS_CLASS.dot.pending).toBe('bg-amber-500');
		expect(STATUS_HEX.confirmed).toBe('#005d42');
	});

	it('isBookingStatus narrows known values only', () => {
		expect(isBookingStatus('pending')).toBe(true);
		expect(isBookingStatus('weird')).toBe(false);
	});

	it('falls back for unknown statuses', () => {
		expect(getStatusLabel('weird')).toBe('weird');
		expect(getStatusClass('appointment', 'unknown')).toBe(
			'bg-surface-container text-on-surface-variant'
		);
		expect(getStatusClass('pill', 'unknown')).toBe(
			'bg-surface-container text-on-surface-variant ring-outline-variant/40'
		);
		expect(getStatusClass('dot', 'unknown')).toBe('bg-outline');
	});
});
