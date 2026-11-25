import { fail } from '@sveltejs/kit';
import { asc, count, eq, ilike } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { doctorSchedules, doctors } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/pagination.ts';
import { denyUnlessManager } from '#lib/server/guards.ts';
import { listDoctorOptions } from '#lib/server/catalog.ts';
import { isUuid } from '#lib/server/db-errors.ts';
import { formStr, readEntityId, withFkGuard } from '#lib/server/http/forms.ts';
import { paginate, searchWhere, uuidOrUndefined } from '#lib/server/http/list-query.ts';

const REF_ERROR = 'Selected doctor no longer exists.' as const;

function parseScheduleForm(fd: FormData) {
	const doctorId = formStr(fd, 'doctorId');
	const dayRaw = formStr(fd, 'dayOfWeek');
	// Number('') is 0 (Sunday), so an empty value must be rejected explicitly.
	const dayOfWeek = dayRaw === '' ? NaN : Number(dayRaw);
	const startTime = formStr(fd, 'startTime').slice(0, 5);
	const endTime = formStr(fd, 'endTime').slice(0, 5);
	const maxQuota = Number(fd.get('maxQuota') ?? 5);

	if (!doctorId) return { error: 'Doctor is required.' as const };
	if (!isUuid(doctorId)) return { error: REF_ERROR };
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
	const doctorId = uuidOrUndefined(doctorFilter);

	const where = searchWhere(q, [doctors.name], [doctorId ? eq(doctorSchedules.doctorId, doctorId) : undefined]);

	const { rows, total } = await paginate(
		db
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
			.where(where)
			.orderBy(asc(doctors.name), asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.startTime))
			.limit(pageSize)
			.offset(offset),
		db
			.select({ value: count() })
			.from(doctorSchedules)
			.innerJoin(doctors, eq(doctorSchedules.doctorId, doctors.id))
			.where(where)
	);

	return {
		schedules: rows,
		total,
		page,
		pageSize,
		query: q,
		doctorFilter,
		doctors: await listDoctorOptions()
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const parsed = parseScheduleForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		const failure = await withFkGuard(
			() => db.insert(doctorSchedules).values(parsed).then(() => null),
			400,
			REF_ERROR
		);
		if (failure) return failure;
		return { success: true, message: 'Schedule created.' };
	},

	update: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const entity = readEntityId(fd, 'schedule');
		if ('status' in entity) return entity;
		const parsed = parseScheduleForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		const result = await withFkGuard(
			() => db.update(doctorSchedules).set(parsed).where(eq(doctorSchedules.id, entity.id)).returning(),
			400,
			REF_ERROR
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Schedule not found.' });
		return { success: true, message: 'Schedule updated.' };
	},

	delete: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const entity = readEntityId(await request.formData(), 'schedule');
		if ('status' in entity) return entity;
		const result = await withFkGuard(
			() => db.delete(doctorSchedules).where(eq(doctorSchedules.id, entity.id)).returning(),
			409,
			'Schedule has bookings and cannot be deleted.'
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Schedule not found.' });
		return { success: true, message: 'Schedule deleted.' };
	}
};
