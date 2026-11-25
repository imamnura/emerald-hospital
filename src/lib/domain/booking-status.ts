/** Mirrors the `booking_status` DB enum (schema.ts imports this list). */
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function isBookingStatus(v: string): v is BookingStatus {
	return (BOOKING_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
	pending: 'Pending',
	confirmed: 'Confirmed',
	cancelled: 'Cancelled',
	completed: 'Completed'
};

export type StatusClassVariant = 'badge' | 'pill' | 'dot' | 'appointment';

export const STATUS_CLASS: Record<StatusClassVariant, Record<BookingStatus, string>> = {
	badge: {
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-primary/15 text-primary',
		completed: 'bg-surface-container text-on-surface-variant',
		cancelled: 'bg-red-100 text-red-800'
	},
	pill: {
		pending: 'bg-amber-100 text-amber-800 ring-amber-200',
		confirmed: 'bg-primary/10 text-primary ring-primary/20',
		completed: 'bg-surface-container text-on-surface-variant ring-outline-variant/40',
		cancelled: 'bg-red-50 text-error ring-red-200'
	},
	dot: {
		pending: 'bg-amber-500',
		confirmed: 'bg-primary',
		completed: 'bg-outline',
		cancelled: 'bg-error'
	},
	appointment: {
		pending: 'bg-surface-container text-on-surface-variant',
		confirmed: 'bg-surface-container text-on-surface-variant',
		cancelled: 'bg-red-50 text-error',
		completed: 'bg-surface-container text-outline'
	}
};

export const STATUS_HEX: Record<BookingStatus, string> = {
	pending: '#f59e0b',
	confirmed: '#005d42',
	completed: '#6e7a73',
	cancelled: '#ba1a1a'
};

const CLASS_FALLBACK: Record<StatusClassVariant, string> = {
	badge: 'bg-surface-container text-on-surface-variant',
	pill: 'bg-surface-container text-on-surface-variant ring-outline-variant/40',
	dot: 'bg-outline',
	appointment: 'bg-surface-container text-on-surface-variant'
};

/** Label for a status; unknown values fall back to the raw string. */
export function getStatusLabel(status: string): string {
	return isBookingStatus(status) ? STATUS_LABEL[status] : status;
}

/** Class string for a status; unknown values get the neutral fallback. */
export function getStatusClass(variant: StatusClassVariant, status: string): string {
	return isBookingStatus(status) ? STATUS_CLASS[variant][status] : CLASS_FALLBACK[variant];
}
