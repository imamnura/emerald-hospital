type DatePreset =
	| 'short'
	| 'long'
	| 'longId'
	| 'monthYear'
	| 'monthYearShort'
	| 'dayMonth'
	| 'weekdayDayMonth'
	| 'weekdayShort';

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

const PRESETS: Record<DatePreset, { locale: string; opts: Intl.DateTimeFormatOptions }> = {
	short: { locale: 'en-US', opts: { month: 'short', day: 'numeric', year: 'numeric' } },
	long: {
		locale: 'en-US',
		opts: { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
	},
	longId: {
		locale: 'id-ID',
		opts: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
	},
	monthYear: { locale: 'en-US', opts: { month: 'long', year: 'numeric' } },
	monthYearShort: { locale: 'en-US', opts: { month: 'short', year: 'numeric' } },
	dayMonth: { locale: 'en-US', opts: { month: 'short', day: 'numeric' } },
	weekdayDayMonth: { locale: 'en-US', opts: { weekday: 'short', month: 'short', day: 'numeric' } },
	weekdayShort: { locale: 'en-US', opts: { weekday: 'short' } }
};

/** Matches a `YYYY-MM-DD` date string. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` is anchored at local noon so the calendar day survives any timezone. */
export function parseIsoDate(value: string | Date): Date {
	if (typeof value !== 'string') return value;
	return ISO_DATE_RE.test(value) ? new Date(value + 'T12:00:00') : new Date(value);
}

export function formatDate(value: string | Date, preset: DatePreset): string {
	const { locale, opts } = PRESETS[preset];
	return parseIsoDate(value).toLocaleDateString(locale, opts);
}

/** YYYY-MM-DD in the local timezone. `toISOString()` is UTC and shifts the day east of UTC (e.g. WIB). */
export function toLocalDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function formatTime12h(time24: string): string {
	const [h, m] = time24.split(':').map(Number);
	const period = h >= 12 ? 'PM' : 'AM';
	const hour12 = h % 12 || 12;
	return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}
