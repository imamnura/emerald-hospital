import { fail } from '@sveltejs/kit';
import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { doctors, hospitals, specialists } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/pagination.ts';
import { denyUnlessManager } from '#lib/server/guards.ts';
import { isForeignKeyViolation, isUuid } from '#lib/server/db-errors.ts';

const REF_ERROR = 'Selected hospital or specialty no longer exists.' as const;

function parseDoctorForm(fd: FormData) {
	const name = String(fd.get('name') ?? '').trim();
	const hospitalId = String(fd.get('hospitalId') ?? '').trim();
	const specialistId = String(fd.get('specialistId') ?? '').trim();
	const imageUrl = String(fd.get('imageUrl') ?? '').trim() || null;
	const ratingRaw = String(fd.get('rating') ?? '4.5').trim();
	const ratingNum = Number(ratingRaw);
	if (!name || !hospitalId || !specialistId) {
		return { error: 'Name, hospital, and specialty are required.' as const };
	}
	if (!isUuid(hospitalId) || !isUuid(specialistId)) {
		return { error: REF_ERROR };
	}
	if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 5) {
		return { error: 'Rating must be between 0 and 5.' as const };
	}
	const isActive = fd.get('isActive') !== null;
	const bio = String(fd.get('bio') ?? '').trim() || null;
	const feeRaw = String(fd.get('consultationFee') ?? '').trim();
	const consultationFee = feeRaw ? (Number.isFinite(Number(feeRaw)) ? Number(feeRaw).toFixed(2) : null) : null;
	if (feeRaw && consultationFee === null) {
		return { error: 'Consultation fee must be a number.' as const };
	}
	return {
		name,
		hospitalId,
		specialistId,
		imageUrl,
		rating: ratingNum.toFixed(1),
		isActive,
		bio,
		...(consultationFee ? { consultationFee } : {})
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const hospitalFilter = url.searchParams.get('hospitalId')?.trim() ?? '';
	const specialistFilter = url.searchParams.get('specialistId')?.trim() ?? '';

	const conditions: SQL[] = [];
	if (q) {
		const like = `%${q}%`;
		conditions.push(or(ilike(doctors.name, like), ilike(specialists.name, like), ilike(hospitals.name, like))!);
	}
	if (hospitalFilter) conditions.push(eq(doctors.hospitalId, hospitalFilter));
	if (specialistFilter) conditions.push(eq(doctors.specialistId, specialistFilter));
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalQ = db
		.select({ value: count() })
		.from(doctors)
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id));
	if (where) totalQ.where(where);
	const [{ value: total }] = await totalQ;

	const listQ = db
		.select({
			id: doctors.id,
			name: doctors.name,
			rating: doctors.rating,
			isActive: doctors.isActive,
			isOnline: doctors.isOnline,
			imageUrl: doctors.imageUrl,
			consultationFee: doctors.consultationFee,
			bio: doctors.bio,
			hospital: hospitals.name,
			hospitalId: hospitals.id,
			specialty: specialists.name,
			specialistId: specialists.id
		})
		.from(doctors)
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.orderBy(asc(doctors.name))
		.limit(pageSize)
		.offset(offset);
	if (where) listQ.where(where);
	const list = await listQ;

	const [allHospitals, allSpecialists] = await Promise.all([
		db.select({ id: hospitals.id, name: hospitals.name }).from(hospitals).orderBy(asc(hospitals.name)),
		db.select({ id: specialists.id, name: specialists.name }).from(specialists).orderBy(asc(specialists.name))
	]);

	return {
		doctors: list,
		total: Number(total),
		page,
		pageSize,
		query: q,
		hospitalFilter,
		specialistFilter,
		hospitals: allHospitals,
		specialists: allSpecialists
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const parsed = parseDoctorForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		try {
			await db.insert(doctors).values(parsed);
		} catch (e) {
			if (isForeignKeyViolation(e)) return fail(400, { error: REF_ERROR });
			throw e;
		}
		return { success: true, message: 'Doctor created.' };
	},

	update: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing doctor ID.' });
		if (!isUuid(id)) return fail(404, { error: 'Doctor not found.' });
		const parsed = parseDoctorForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		let result;
		try {
			result = await db.update(doctors).set(parsed).where(eq(doctors.id, id)).returning();
		} catch (e) {
			if (isForeignKeyViolation(e)) return fail(400, { error: REF_ERROR });
			throw e;
		}
		if (result.length === 0) return fail(404, { error: 'Doctor not found.' });
		return { success: true, message: 'Doctor updated.' };
	},

	delete: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing doctor ID.' });
		if (!isUuid(id)) return fail(404, { error: 'Doctor not found.' });
		let result;
		try {
			result = await db.delete(doctors).where(eq(doctors.id, id)).returning();
		} catch (e) {
			if (isForeignKeyViolation(e)) return fail(409, { error: 'Doctor has bookings and cannot be deleted. Mark them inactive instead.' });
			throw e;
		}
		if (result.length === 0) return fail(404, { error: 'Doctor not found.' });
		return { success: true, message: 'Doctor deleted.' };
	}
};
