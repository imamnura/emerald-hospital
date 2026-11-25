import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { SelectedFields } from 'drizzle-orm/pg-core';
import { db } from './db';
import { bookings, doctors, hospitals, specialists, users } from './db/schema';

export type DateRangePreset = '7d' | '30d' | '90d' | '365d' | 'all';

export type AnalyticsFilters = {
	range: DateRangePreset;
	hospitalId: string | null;
	specialistId: string | null;
};

export function parseFilters(searchParams: URLSearchParams): AnalyticsFilters {
	const raw = searchParams.get('range') ?? '30d';
	const range: DateRangePreset = (
		['7d', '30d', '90d', '365d', 'all'].includes(raw) ? raw : '30d'
	) as DateRangePreset;
	return {
		range,
		hospitalId: searchParams.get('hospitalId') || null,
		specialistId: searchParams.get('specialistId') || null
	};
}

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as const;

function startOfRange(range: DateRangePreset): Date | null {
	if (range === 'all') return null;
	const days = RANGE_DAYS[range];
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	d.setUTCDate(d.getUTCDate() - (days - 1));
	return d;
}

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** bookings joined to their doctor — the base of every dashboard aggregate. */
function bookingsWithDoctors<T extends SelectedFields>(fields: T) {
	return db
		.select(fields)
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id));
}

function whereForFilters(filters: AnalyticsFilters): SQL {
	const start = startOfRange(filters.range);
	const today = isoDate(new Date());

	const conditions: SQL[] = [];
	if (start) conditions.push(gte(bookings.appointmentDate, isoDate(start)));
	conditions.push(lte(bookings.appointmentDate, today));
	if (filters.hospitalId) conditions.push(eq(doctors.hospitalId, filters.hospitalId));
	if (filters.specialistId) conditions.push(eq(doctors.specialistId, filters.specialistId));

	return and(...conditions) as SQL;
}

export type Totals = {
	hospitals: number;
	doctors: number;
	bookings: number;
	pending: number;
};

export async function totals(filters: AnalyticsFilters): Promise<Totals> {
	const [hospitalsRow] = await db.select({ value: count() }).from(hospitals);
	const [doctorsRow] = await db.select({ value: count() }).from(doctors);

	const where = whereForFilters(filters);
	const [bookingsRow] = await bookingsWithDoctors({ value: count() }).where(where);
	const [pendingRow] = await bookingsWithDoctors({ value: count() }).where(
		and(where, eq(bookings.status, 'pending'))
	);

	return {
		hospitals: Number(hospitalsRow?.value ?? 0),
		doctors: Number(doctorsRow?.value ?? 0),
		bookings: Number(bookingsRow?.value ?? 0),
		pending: Number(pendingRow?.value ?? 0)
	};
}

/** Previous-period totals for trend % */
export async function previousTotals(filters: AnalyticsFilters): Promise<{ bookings: number; pending: number }> {
	if (filters.range === 'all') return { bookings: 0, pending: 0 };
	const days = RANGE_DAYS[filters.range];
	const end = new Date();
	end.setUTCHours(0, 0, 0, 0);
	end.setUTCDate(end.getUTCDate() - days);
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - (days - 1));

	const conditions: SQL[] = [
		gte(bookings.appointmentDate, isoDate(start)),
		lte(bookings.appointmentDate, isoDate(end))
	];
	if (filters.hospitalId) conditions.push(eq(doctors.hospitalId, filters.hospitalId));
	if (filters.specialistId) conditions.push(eq(doctors.specialistId, filters.specialistId));
	const where = and(...conditions);

	const [b] = await bookingsWithDoctors({ value: count() }).where(where);
	const [p] = await bookingsWithDoctors({ value: count() }).where(
		and(where, eq(bookings.status, 'pending'))
	);

	return { bookings: Number(b?.value ?? 0), pending: Number(p?.value ?? 0) };
}

export type TimeSeriesPoint = { date: string; total: number };

/** Bookings per day across the active range (fills missing days with 0) */
export async function bookingsOverTime(filters: AnalyticsFilters): Promise<TimeSeriesPoint[]> {
	const where = whereForFilters(filters);
	const rows = await bookingsWithDoctors({ date: bookings.appointmentDate, value: count() })
		.where(where)
		.groupBy(bookings.appointmentDate)
		.orderBy(bookings.appointmentDate);

	const map = new Map<string, number>();
	for (const r of rows) map.set(String(r.date), Number(r.value));

	const start =
		filters.range === 'all'
			? rows.length > 0
				? new Date(String(rows[0].date))
				: new Date()
			: (startOfRange(filters.range) ?? new Date());
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date();
	end.setUTCHours(0, 0, 0, 0);

	const out: TimeSeriesPoint[] = [];
	for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
		const key = isoDate(d);
		out.push({ date: key, total: map.get(key) ?? 0 });
	}
	return out;
}

export type StatusSegment = {
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	count: number;
};

export async function statusBreakdown(filters: AnalyticsFilters): Promise<StatusSegment[]> {
	const where = whereForFilters(filters);
	const rows = await bookingsWithDoctors({ status: bookings.status, value: count() })
		.where(where)
		.groupBy(bookings.status);

	const out: Record<StatusSegment['status'], number> = {
		pending: 0,
		confirmed: 0,
		cancelled: 0,
		completed: 0
	};
	for (const r of rows) out[r.status as StatusSegment['status']] = Number(r.value);
	return (['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => ({
		status,
		count: out[status]
	}));
}

export type SpecialtyRow = { specialty: string; total: number };

export async function bookingsBySpecialty(filters: AnalyticsFilters): Promise<SpecialtyRow[]> {
	const where = whereForFilters(filters);
	const rows = await bookingsWithDoctors({ specialty: specialists.name, value: count() })
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.where(where)
		.groupBy(specialists.name)
		.orderBy(desc(count()));
	return rows.map((r) => ({ specialty: r.specialty, total: Number(r.value) }));
}

export type TopDoctorRow = {
	id: string;
	name: string;
	specialty: string;
	total: number;
};

export async function topDoctors(filters: AnalyticsFilters, limit = 5): Promise<TopDoctorRow[]> {
	const where = whereForFilters(filters);
	const rows = await bookingsWithDoctors({
		id: doctors.id,
		name: doctors.name,
		specialty: specialists.name,
		value: count()
	})
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.where(where)
		.groupBy(doctors.id, doctors.name, specialists.name)
		.orderBy(desc(count()))
		.limit(limit);
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		specialty: r.specialty,
		total: Number(r.value)
	}));
}

export type RecentBookingRow = {
	id: string;
	patient: string;
	doctor: string;
	specialty: string;
	hospital: string;
	date: string;
	time: string;
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
};

const bookingRowSelect = {
	id: bookings.id,
	patient: users.name,
	doctor: doctors.name,
	specialty: specialists.name,
	hospital: hospitals.name,
	date: bookings.appointmentDate,
	time: bookings.appointmentTime,
	status: bookings.status
};

async function bookingRowsQuery(
	where: SQL,
	{ order, limit }: { order: SQL[]; limit?: number }
): Promise<RecentBookingRow[]> {
	const q = bookingsWithDoctors(bookingRowSelect)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(where)
		.orderBy(...order);
	const rows = await (limit === undefined ? q : q.limit(limit));
	return rows.map((r) => ({
		id: r.id,
		patient: r.patient,
		doctor: r.doctor,
		specialty: r.specialty,
		hospital: r.hospital,
		date: String(r.date),
		time: r.time,
		status: r.status as RecentBookingRow['status']
	}));
}

export async function recentBookings(filters: AnalyticsFilters, limit = 8): Promise<RecentBookingRow[]> {
	return bookingRowsQuery(whereForFilters(filters), { order: [desc(bookings.createdAt)], limit });
}

/** Full booking list for CSV export — same filters as dashboard. */
export async function exportRows(filters: AnalyticsFilters): Promise<RecentBookingRow[]> {
	return bookingRowsQuery(whereForFilters(filters), {
		order: [desc(bookings.appointmentDate), desc(bookings.appointmentTime)]
	});
}

export function rangeLabel(range: DateRangePreset): string {
	return {
		'7d': 'Last 7 days',
		'30d': 'Last 30 days',
		'90d': 'Last 90 days',
		'365d': 'Last 12 months',
		all: 'All time'
	}[range];
}
