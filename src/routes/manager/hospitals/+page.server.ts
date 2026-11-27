import { fail } from '@sveltejs/kit';
import { asc, count, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { hospitals } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/http/pagination.ts';
import { denyUnlessManager } from '#lib/server/auth/guards.ts';
import { formOpt, formStr, readEntityId, withFkGuard } from '#lib/server/http/forms.ts';
import { paginate, searchWhere } from '#lib/server/http/list-query.ts';

function parseHospitalForm(fd: FormData) {
	const name = formStr(fd, 'name');
	const address = formStr(fd, 'address');
	const city = formStr(fd, 'city');
	const contact = formOpt(fd, 'contact');
	const imageUrl = formOpt(fd, 'imageUrl');
	if (!name || !address || !city) {
		return { error: 'Name, address, and city are required.' as const };
	}
	return { name, address, city, contact, imageUrl };
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const where = searchWhere(q, [hospitals.name, hospitals.city, hospitals.address]);

	const { rows, total } = await paginate(
		db.select().from(hospitals).where(where).orderBy(asc(hospitals.name)).limit(pageSize).offset(offset),
		db.select({ value: count() }).from(hospitals).where(where)
	);

	return { hospitals: rows, total, page, pageSize, query: q };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const parsed = parseHospitalForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await db.insert(hospitals).values(parsed);
		return { success: true, message: 'Hospital created.' };
	},

	update: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const entity = readEntityId(fd, 'hospital');
		if ('status' in entity) return entity;

		const parsed = parseHospitalForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		const result = await db.update(hospitals).set(parsed).where(eq(hospitals.id, entity.id)).returning();
		if (result.length === 0) return fail(404, { error: 'Hospital not found.' });
		return { success: true, message: 'Hospital updated.' };
	},

	delete: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const entity = readEntityId(await request.formData(), 'hospital');
		if ('status' in entity) return entity;
		const result = await withFkGuard(
			() => db.delete(hospitals).where(eq(hospitals.id, entity.id)).returning(),
			409,
			'Hospital still has doctors. Remove or reassign them first.'
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Hospital not found.' });
		return { success: true, message: 'Hospital deleted.' };
	}
};
