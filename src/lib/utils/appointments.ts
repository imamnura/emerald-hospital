import { formatTime12h } from './booking-ui';

export type AppointmentTab = 'upcoming' | 'past';

/** e.g. Oct 17, 2023 — for cancel confirmation modal */
export function formatCancelModalDate(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatAppointmentListDate(dateStr: string, time24: string): string {
	const datePart = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
	return `${datePart} • ${formatTime12h(time24)}`;
}

export function isUpcomingAppointment(
	appointmentDate: string,
	status: string,
	today = new Date()
): boolean {
	const todayStr = today.toISOString().slice(0, 10);
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
