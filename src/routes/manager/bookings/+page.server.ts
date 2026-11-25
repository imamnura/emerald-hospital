import { fail } from '@sveltejs/kit';
import { count, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { bookings, doctors, hospitals, specialists, users } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/pagination.ts';
import { denyUnlessManager } from '#lib/server/guards.ts';
import { isBookingStatus, type BookingStatus } from '#lib/domain/booking-status.ts';
import { formStr, readEntityId } from '#lib/server/http/forms.ts';
import { paginate, searchWhere } from '#lib/server/http/list-query.ts';

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const statusFilter = url.searchParams.get('status')?.trim() ?? '';

	// The search condition is built once; the status tab counts use it without the status filter.
	const searchCols = [users.name, doctors.name, specialists.name, hospitals.name];
	const searchOnly = searchWhere(q, searchCols);
	const where = searchWhere(q, searchCols, [
		statusFilter && isBookingStatus(statusFilter) ? eq(bookings.status, statusFilter) : undefined
	]);

	const { rows, total } = await paginate(
		db
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
			.where(where)
			.orderBy(desc(bookings.appointmentDate), desc(bookings.appointmentTime))
			.limit(pageSize)
			.offset(offset),
		db
			.select({ value: count() })
			.from(bookings)
			.innerJoin(users, eq(bookings.userId, users.id))
			.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
			.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
			.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
			.where(where)
	);

	const statusRows = await db
		.select({ status: bookings.status, value: count() })
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(searchOnly)
		.groupBy(bookings.status);
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
		bookings: rows,
		total,
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
		const entity = readEntityId(fd, 'booking');
		if ('status' in entity) return entity;
		const status = formStr(fd, 'status');
		if (!isBookingStatus(status)) return fail(400, { error: 'Invalid status.' });
		const result = await db
			.update(bookings)
			.set({ status })
			.where(eq(bookings.id, entity.id))
			.returning({ id: bookings.id });
		if (result.length === 0) return fail(404, { error: 'Booking not found.' });
		return { success: true, message: 'Status updated.' };
	}
};
