import { fail } from '@sveltejs/kit';
import { and, asc, count, eq, ilike, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { doctorSchedules, doctors } from '$lib/server/db/schema';
import { parsePagination } from '$lib/server/pagination';

function parseScheduleForm(fd: FormData) {
	const doctorId = String(fd.get('doctorId') ?? '');
	const dayOfWeek = Number(fd.get('dayOfWeek'));
	const startTime = String(fd.get('startTime') ?? '').slice(0, 5);
	const endTime = String(fd.get('endTime') ?? '').slice(0, 5);
	const maxQuota = Number(fd.get('maxQuota') ?? 5);

	if (!doctorId) return { error: 'Doctor is required.' as const };
	if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
		return { error: 'Day of week must be 0–6.' as const };
	}
	if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
		return { error: 'Times must be HH:MM.' as const };
	}
	if (startTime >= endTime) {
		return { error: 'Start time must be before end time.' as const };
	}
	if (!Number.isInteger(maxQuota) || maxQuota < 1) {
		return { error: 'Max quota must be at least 1.' as const };
	}
	return { doctorId, dayOfWeek, startTime, endTime, maxQuota };
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const doctorFilter = url.searchParams.get('doctorId')?.trim() ?? '';

	const conditions: SQL[] = [];
	if (q) conditions.push(ilike(doctors.name, `%${q}%`));
	if (doctorFilter) conditions.push(eq(doctorSchedules.doctorId, doctorFilter));
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalQ = db
		.select({ value: count() })
		.from(doctorSchedules)
		.innerJoin(doctors, eq(doctorSchedules.doctorId, doctors.id));
	if (where) totalQ.where(where);
	const [{ value: total }] = await totalQ;

	const listQ = db
		.select({
			id: doctorSchedules.id,
			doctorId: doctorSchedules.doctorId,
			dayOfWeek: doctorSchedules.dayOfWeek,
			startTime: doctorSchedules.startTime,
			endTime: doctorSchedules.endTime,
			maxQuota: doctorSchedules.maxQuota,
			doctorName: doctors.name
		})
		.from(doctorSchedules)
		.innerJoin(doctors, eq(doctorSchedules.doctorId, doctors.id))
		.orderBy(asc(doctors.name), asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.startTime))
		.limit(pageSize)
		.offset(offset);
	if (where) listQ.where(where);
	const list = await listQ;

	const allDoctors = await db
		.select({ id: doctors.id, name: doctors.name })
		.from(doctors)
		.orderBy(asc(doctors.name));

	return {
		schedules: list,
		total: Number(total),
		page,
		pageSize,
		query: q,
		doctorFilter,
		doctors: allDoctors
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const parsed = parseScheduleForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		await db.insert(doctorSchedules).values(parsed);
		return { success: true, message: 'Schedule created.' };
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing schedule ID.' });
		const parsed = parseScheduleForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		const result = await db
			.update(doctorSchedules)
			.set(parsed)
			.where(eq(doctorSchedules.id, id))
			.returning();
		if (result.length === 0) return fail(404, { error: 'Schedule not found.' });
		return { success: true, message: 'Schedule updated.' };
	},

	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing schedule ID.' });
		const result = await db
			.delete(doctorSchedules)
			.where(eq(doctorSchedules.id, id))
			.returning();
		if (result.length === 0) return fail(404, { error: 'Schedule not found.' });
		return { success: true, message: 'Schedule deleted.' };
	}
};
