import { fail } from '@sveltejs/kit';
import { and, asc, count, eq, ilike, ne, or, type SQL } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { specialists } from '$lib/server/db/schema';
import { parsePagination } from '$lib/server/pagination';

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}

function parseSpecialistForm(fd: FormData) {
	const name = String(fd.get('name') ?? '').trim();
	const slugRaw = String(fd.get('slug') ?? '').trim().toLowerCase();
	const slug = slugRaw ? slugify(slugRaw) : '';
	const icon = String(fd.get('icon') ?? '').trim() || null;
	if (!name) return { error: 'Name is required.' as const };
	if (!slug) return { error: 'Slug is required.' as const };
	if (!/^[a-z0-9-]+$/.test(slug)) {
		return { error: 'Slug may only contain lowercase letters, numbers, and dashes.' as const };
	}
	return { name, slug, icon };
}

export const load: PageServerLoad = async ({ url }) => {
	const { page, pageSize, offset } = parsePagination(url.searchParams);
	const q = url.searchParams.get('q')?.trim() ?? '';

	const conditions: SQL[] = [];
	if (q) {
		const like = `%${q}%`;
		conditions.push(or(ilike(specialists.name, like), ilike(specialists.slug, like))!);
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const totalQ = db.select({ value: count() }).from(specialists);
	if (where) totalQ.where(where);
	const [{ value: total }] = await totalQ;

	const listQ = db
		.select()
		.from(specialists)
		.orderBy(asc(specialists.name))
		.limit(pageSize)
		.offset(offset);
	if (where) listQ.where(where);
	const list = await listQ;

	return {
		specialists: list,
		total: Number(total),
		page,
		pageSize,
		query: q
	};
};

async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
	const conditions: SQL[] = [eq(specialists.slug, slug)];
	if (excludeId) conditions.push(ne(specialists.id, excludeId));
	const [row] = await db
		.select({ id: specialists.id })
		.from(specialists)
		.where(and(...conditions))
		.limit(1);
	return Boolean(row);
}

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const parsed = parseSpecialistForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		if (await slugTaken(parsed.slug)) return fail(400, { error: 'Slug is already in use.' });
		await db.insert(specialists).values(parsed);
		return { success: true, message: 'Specialty created.' };
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing specialty ID.' });
		const parsed = parseSpecialistForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		if (await slugTaken(parsed.slug, id))
			return fail(400, { error: 'Slug is already in use by another specialty.' });
		const result = await db
			.update(specialists)
			.set(parsed)
			.where(eq(specialists.id, id))
			.returning();
		if (result.length === 0) return fail(404, { error: 'Specialty not found.' });
		return { success: true, message: 'Specialty updated.' };
	},

	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing specialty ID.' });
		const result = await db.delete(specialists).where(eq(specialists.id, id)).returning();
		if (result.length === 0) return fail(404, { error: 'Specialty not found.' });
		return { success: true, message: 'Specialty deleted.' };
	}
};
