export function statusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending: 'Menunggu',
		confirmed: 'Dikonfirmasi',
		cancelled: 'Dibatalkan',
		completed: 'Selesai'
	};
	return labels[status] ?? status;
}

export function statusColor(status: string): string {
	const colors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-primary/15 text-primary',
		cancelled: 'bg-red-100 text-red-800',
		completed: 'bg-surface-container text-on-surface-variant'
	};
	return colors[status] ?? 'bg-surface-container text-on-surface-variant';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
	return classes.filter(Boolean).join(' ');
}
