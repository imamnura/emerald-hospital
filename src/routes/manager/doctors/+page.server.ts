import { fail } from '@sveltejs/kit';
import { asc, count, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { doctors, hospitals, specialists } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/pagination.ts';
import { denyUnlessManager } from '#lib/server/guards.ts';
import { listHospitals, listSpecialists } from '#lib/server/catalog.ts';
import { isUuid } from '#lib/server/db-errors.ts';
import { formOpt, formStr, readEntityId, withFkGuard } from '#lib/server/http/forms.ts';
import { paginate, searchWhere, uuidOrUndefined } from '#lib/server/http/list-query.ts';

const REF_ERROR = 'Selected hospital or specialty no longer exists.' as const;

function parseDoctorForm(fd: FormData) {
	const name = formStr(fd, 'name');
	const hospitalId = formStr(fd, 'hospitalId');
	const specialistId = formStr(fd, 'specialistId');
	const imageUrl = formOpt(fd, 'imageUrl');
	const ratingRaw = fd.get('rating') === null ? '4.5' : formStr(fd, 'rating');
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
	const bio = formOpt(fd, 'bio');
	const feeRaw = formStr(fd, 'consultationFee');
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
	const hospitalId = uuidOrUndefined(hospitalFilter);
	const specialistId = uuidOrUndefined(specialistFilter);

	const where = searchWhere(
		q,
		[doctors.name, specialists.name, hospitals.name],
		[hospitalId ? eq(doctors.hospitalId, hospitalId) : undefined, specialistId ? eq(doctors.specialistId, specialistId) : undefined]
	);

	const [{ rows, total }, allHospitals, allSpecialists] = await Promise.all([
		paginate(
			db
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
				.where(where)
				.orderBy(asc(doctors.name))
				.limit(pageSize)
				.offset(offset),
			db
				.select({ value: count() })
				.from(doctors)
				.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
				.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
				.where(where)
		),
		listHospitals(),
		listSpecialists()
	]);

	return {
		doctors: rows,
		total,
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
		const failure = await withFkGuard(() => db.insert(doctors).values(parsed).then(() => null), 400, REF_ERROR);
		if (failure) return failure;
		return { success: true, message: 'Doctor created.' };
	},

	update: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const entity = readEntityId(fd, 'doctor');
		if ('status' in entity) return entity;
		const parsed = parseDoctorForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		const result = await withFkGuard(
			() => db.update(doctors).set(parsed).where(eq(doctors.id, entity.id)).returning(),
			400,
			REF_ERROR
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Doctor not found.' });
		return { success: true, message: 'Doctor updated.' };
	},

	delete: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const entity = readEntityId(await request.formData(), 'doctor');
		if ('status' in entity) return entity;
		const result = await withFkGuard(
			() => db.delete(doctors).where(eq(doctors.id, entity.id)).returning(),
			409,
			'Doctor has bookings and cannot be deleted. Mark them inactive instead.'
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Doctor not found.' });
		return { success: true, message: 'Doctor deleted.' };
	}
};
