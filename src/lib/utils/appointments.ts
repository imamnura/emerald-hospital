import { getStatusClass, getStatusLabel } from '#lib/domain/booking-status.ts';
import { formatDate, formatTime12h, toLocalDateString } from '#lib/format/date.ts';

export type AppointmentTab = 'upcoming' | 'past';

export function formatAppointmentListDate(dateStr: string, time24: string): string {
	const datePart = formatDate(dateStr, 'weekdayDayMonth');
	return `${datePart} • ${formatTime12h(time24)}`;
}

export function isUpcomingAppointment(
	appointmentDate: string,
	status: string,
	today = new Date()
): boolean {
	const todayStr = toLocalDateString(today);
	if (status === 'cancelled' || status === 'completed') return false;
	return appointmentDate >= todayStr;
}

export function appointmentStatusLabel(status: string): string {
	return getStatusLabel(status);
}

export function appointmentStatusStyles(status: string): string {
	return getStatusClass('appointment', status);
}
