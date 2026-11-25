import { formatDate, toLocalDateString } from '#lib/format/date.ts';

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

export function generateCalendarDays(availableDayNumbers: number[], count = 14): CalendarDay[] {
	const days: CalendarDay[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = 0; i < count; i++) {
		const d = new Date(today);
		d.setDate(today.getDate() + i);
		const dateStr = toLocalDateString(d);
		const dayOfWeek = d.getDay();

		days.push({
			date: dateStr,
			dayLabel: formatDate(d, 'weekdayShort').toUpperCase(),
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
