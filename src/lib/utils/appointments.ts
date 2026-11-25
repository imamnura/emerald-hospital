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
	const labels: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		cancelled: 'Cancelled',
		completed: 'Completed'
	};
	return labels[status] ?? status;
}

export function appointmentStatusStyles(status: string): string {
	const styles: Record<string, string> = {
		pending: 'bg-surface-container text-on-surface-variant',
		confirmed: 'bg-surface-container text-on-surface-variant',
		cancelled: 'bg-red-50 text-error',
		completed: 'bg-surface-container text-outline'
	};
	return styles[status] ?? 'bg-surface-container text-on-surface-variant';
}
