import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
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

function startOfRange(range: DateRangePreset): Date | null {
	if (range === 'all') return null;
	const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[range];
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	d.setUTCDate(d.getUTCDate() - (days - 1));
	return d;
}

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function whereForFilters(filters: AnalyticsFilters): SQL | undefined {
	const start = startOfRange(filters.range);
	const today = isoDate(new Date());

	const conditions: SQL[] = [];
	if (start) conditions.push(gte(bookings.appointmentDate, isoDate(start)));
	conditions.push(lte(bookings.appointmentDate, today));
	if (filters.hospitalId) conditions.push(eq(doctors.hospitalId, filters.hospitalId));
	if (filters.specialistId) conditions.push(eq(doctors.specialistId, filters.specialistId));

	return conditions.length === 0 ? undefined : and(...conditions);
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
	const bookingsQ = db
		.select({ value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id));
	if (where) bookingsQ.where(where);
	const [bookingsRow] = await bookingsQ;

	const pendingQ = db
		.select({ value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id));
	const pendingWhere = where
		? and(where, eq(bookings.status, 'pending'))
		: eq(bookings.status, 'pending');
	pendingQ.where(pendingWhere as SQL);
	const [pendingRow] = await pendingQ;

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
	const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[filters.range];
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

	const [b] = await db
		.select({ value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.where(where as SQL);

	const [p] = await db
		.select({ value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.where(and(where, eq(bookings.status, 'pending')) as SQL);

	return { bookings: Number(b?.value ?? 0), pending: Number(p?.value ?? 0) };
}

export type TimeSeriesPoint = { date: string; total: number };

/** Bookings per day across the active range (fills missing days with 0) */
export async function bookingsOverTime(filters: AnalyticsFilters): Promise<TimeSeriesPoint[]> {
	const where = whereForFilters(filters);
	const q = db
		.select({
			date: bookings.appointmentDate,
			value: count()
		})
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.groupBy(bookings.appointmentDate)
		.orderBy(bookings.appointmentDate);
	if (where) q.where(where);
	const rows = await q;

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
	const q = db
		.select({ status: bookings.status, value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.groupBy(bookings.status);
	if (where) q.where(where);
	const rows = await q;

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
	const q = db
		.select({ specialty: specialists.name, value: count() })
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.groupBy(specialists.name)
		.orderBy(desc(count()));
	if (where) q.where(where);
	const rows = await q;
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
	const q = db
		.select({
			id: doctors.id,
			name: doctors.name,
			specialty: specialists.name,
			value: count()
		})
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.groupBy(doctors.id, doctors.name, specialists.name)
		.orderBy(desc(count()))
		.limit(limit);
	if (where) q.where(where);
	const rows = await q;
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

export async function recentBookings(filters: AnalyticsFilters, limit = 8): Promise<RecentBookingRow[]> {
	const where = whereForFilters(filters);
	const q = db
		.select({
			id: bookings.id,
			patient: users.name,
			doctor: doctors.name,
			specialty: specialists.name,
			hospital: hospitals.name,
			date: bookings.appointmentDate,
			time: bookings.appointmentTime,
			status: bookings.status,
			createdAt: bookings.createdAt
		})
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.orderBy(desc(bookings.createdAt))
		.limit(limit);
	if (where) q.where(where);
	const rows = await q;
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

/** Full booking list for CSV export — same filters as dashboard. */
export async function exportRows(filters: AnalyticsFilters): Promise<RecentBookingRow[]> {
	const where = whereForFilters(filters);
	const q = db
		.select({
			id: bookings.id,
			patient: users.name,
			doctor: doctors.name,
			specialty: specialists.name,
			hospital: hospitals.name,
			date: bookings.appointmentDate,
			time: bookings.appointmentTime,
			status: bookings.status
		})
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.orderBy(desc(bookings.appointmentDate), desc(bookings.appointmentTime));
	if (where) q.where(where);
	const rows = await q;
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

export function rangeLabel(range: DateRangePreset): string {
	return {
		'7d': 'Last 7 days',
		'30d': 'Last 30 days',
		'90d': 'Last 90 days',
		'365d': 'Last 12 months',
		all: 'All time'
	}[range];
}
