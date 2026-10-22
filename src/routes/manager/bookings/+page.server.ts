import { fail } from '@sveltejs/kit';
import { and, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { bookings, doctors, hospitals, specialists, users } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/pagination.ts';
import { denyUnlessManager } from '#lib/server/guards.ts';
import { isUuid } from '#lib/server/db-errors.ts';

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
type BookingStatus = (typeof VALID_STATUSES)[number];

function isStatus(value: string): value is BookingStatus {
	return (VALID_STATUSES as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const statusFilter = url.searchParams.get('status')?.trim() ?? '';

	const conditions: SQL[] = [];
	if (q) {
		const like = `%${q}%`;
		conditions.push(
			or(
				ilike(users.name, like),
				ilike(doctors.name, like),
				ilike(specialists.name, like),
				ilike(hospitals.name, like)
			)!
		);
	}
	if (statusFilter && isStatus(statusFilter)) {
		conditions.push(eq(bookings.status, statusFilter));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalQ = db
		.select({ value: count() })
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id));
	if (where) totalQ.where(where);
	const [{ value: total }] = await totalQ;

	const listQ = db
		.select({
			id: bookings.id,
			appointmentDate: bookings.appointmentDate,
			appointmentTime: bookings.appointmentTime,
			status: bookings.status,
			patientName: users.name,
			doctorName: doctors.name,
			specialty: specialists.name,
			hospital: hospitals.name
		})
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.orderBy(desc(bookings.appointmentDate), desc(bookings.appointmentTime))
		.limit(pageSize)
		.offset(offset);
	if (where) listQ.where(where);
	const list = await listQ;

	// Status counts (unfiltered by the status filter itself, so the tab counts stay stable)
	const countConditions: SQL[] = [];
	if (q) {
		const like = `%${q}%`;
		countConditions.push(
			or(
				ilike(users.name, like),
				ilike(doctors.name, like),
				ilike(specialists.name, like),
				ilike(hospitals.name, like)
			)!
		);
	}
	const countWhere = countConditions.length > 0 ? and(...countConditions) : undefined;

	const totalAllQ = db
		.select({ status: bookings.status, value: count() })
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.groupBy(bookings.status);
	if (countWhere) totalAllQ.where(countWhere);
	const statusRows = await totalAllQ;
	const statusCounts: Record<BookingStatus | 'all', number> = {
		all: 0,
		pending: 0,
		confirmed: 0,
		cancelled: 0,
		completed: 0
	};
	for (const r of statusRows) {
		const s = r.status as BookingStatus;
		statusCounts[s] = Number(r.value);
		statusCounts.all += Number(r.value);
	}

	return {
		bookings: list,
		total: Number(total),
		page,
		pageSize,
		query: q,
		statusFilter,
		statusCounts
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const status = String(fd.get('status') ?? '');
		if (!id) return fail(400, { error: 'Missing booking ID.' });
		if (!isUuid(id)) return fail(404, { error: 'Booking not found.' });
		if (!isStatus(status)) return fail(400, { error: 'Invalid status.' });
		const result = await db
			.update(bookings)
			.set({ status })
			.where(eq(bookings.id, id))
			.returning({ id: bookings.id });
		if (result.length === 0) return fail(404, { error: 'Booking not found.' });
		return { success: true, message: 'Status updated.' };
	}
};
