import { fail } from '@sveltejs/kit';
import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { hospitals } from '$lib/server/db/schema';
import { parsePagination } from '$lib/server/pagination';

function parseHospitalForm(fd: FormData) {
	const name = String(fd.get('name') ?? '').trim();
	const address = String(fd.get('address') ?? '').trim();
	const city = String(fd.get('city') ?? '').trim();
	const contact = String(fd.get('contact') ?? '').trim() || null;
	const imageUrl = String(fd.get('imageUrl') ?? '').trim() || null;
	if (!name || !address || !city) {
		return { error: 'Name, address, and city are required.' as const };
	}
	return { name, address, city, contact, imageUrl };
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';

	const conditions: SQL[] = [];
	if (q) {
		const like = `%${q}%`;
		conditions.push(or(ilike(hospitals.name, like), ilike(hospitals.city, like), ilike(hospitals.address, like))!);
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalQ = db.select({ value: count() }).from(hospitals);
	if (where) totalQ.where(where);
	const [{ value: total }] = await totalQ;

	const listQ = db
		.select()
		.from(hospitals)
		.orderBy(asc(hospitals.name))
		.limit(pageSize)
		.offset(offset);
	if (where) listQ.where(where);
	const list = await listQ;

	return {
		hospitals: list,
		total: Number(total),
		page,
		pageSize,
		query: q
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const parsed = parseHospitalForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await db.insert(hospitals).values(parsed);
		return { success: true, message: 'Hospital created.' };
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing hospital ID.' });

		const parsed = parseHospitalForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		const result = await db.update(hospitals).set(parsed).where(eq(hospitals.id, id)).returning();
		if (result.length === 0) return fail(404, { error: 'Hospital not found.' });
		return { success: true, message: 'Hospital updated.' };
	},

	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing hospital ID.' });
		const result = await db.delete(hospitals).where(eq(hospitals.id, id)).returning();
		if (result.length === 0) return fail(404, { error: 'Hospital not found.' });
		return { success: true, message: 'Hospital deleted.' };
	}
};
