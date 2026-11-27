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
