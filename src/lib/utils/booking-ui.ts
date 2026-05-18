export type CalendarDay = {
	date: string;
	dayLabel: string;
	dayNum: number;
	available: boolean;
	isPast: boolean;
};

export type TimeSlotUi = {
	time: string;
	label: string;
	quota: number;
	scheduleId: string;
	period: 'morning' | 'afternoon';
	isFull: boolean;
};

export function formatTime12h(time24: string): string {
	const [h, m] = time24.split(':').map(Number);
	const period = h >= 12 ? 'PM' : 'AM';
	const hour12 = h % 12 || 12;
	return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatMonthYear(dateStr: string): string {
	const d = new Date(dateStr + 'T12:00:00');
	return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatAppointmentDateShort(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatAppointmentDateLong(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function generateCalendarDays(availableDayNumbers: number[], count = 14): CalendarDay[] {
	const days: CalendarDay[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < count; i++) {
		const d = new Date(today);
		d.setDate(today.getDate() + i);
		const dateStr = d.toISOString().slice(0, 10);
		const dayOfWeek = d.getDay();

		days.push({
			date: dateStr,
			dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
			dayNum: d.getDate(),
			available: availableDayNumbers.includes(dayOfWeek),
			isPast: d < today
		});
	}

	return days;
}

export function pickDefaultDate(
	calendarDays: CalendarDay[],
	preferred?: string
): string {
	if (preferred) {
		const match = calendarDays.find((d) => d.date === preferred && d.available && !d.isPast);
		if (match) return match.date;
	}
	return calendarDays.find((d) => d.available && !d.isPast)?.date ?? '';
}

export function groupSlotsByPeriod(slots: TimeSlotUi[]) {
	return {
		morning: slots.filter((s) => s.period === 'morning'),
		afternoon: slots.filter((s) => s.period === 'afternoon')
	};
}
