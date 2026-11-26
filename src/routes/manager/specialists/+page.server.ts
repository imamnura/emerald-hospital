import { fail } from '@sveltejs/kit';
import { asc, count, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { specialists } from '#lib/server/db/schema.ts';
import { parsePagination } from '#lib/server/http/pagination.ts';
import { denyUnlessManager } from '#lib/server/auth/guards.ts';
import { isUniqueViolation } from '#lib/server/db/errors.ts';
import { formOpt, formStr, readEntityId, withFkGuard } from '#lib/server/http/forms.ts';
import { paginate, searchWhere } from '#lib/server/http/list-query.ts';

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}

function parseSpecialistForm(fd: FormData) {
	const name = formStr(fd, 'name');
	const slugRaw = formStr(fd, 'slug').toLowerCase();
	const slug = slugRaw ? slugify(slugRaw) : '';
	const icon = formOpt(fd, 'icon');
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
	const where = searchWhere(q, [specialists.name, specialists.slug]);

	const { rows, total } = await paginate(
		db.select().from(specialists).where(where).orderBy(asc(specialists.name)).limit(pageSize).offset(offset),
		db.select({ value: count() }).from(specialists).where(where)
	);

	return { specialists: rows, total, page, pageSize, query: q };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const parsed = parseSpecialistForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		try {
			await db.insert(specialists).values(parsed);
		} catch (e) {
			if (isUniqueViolation(e)) return fail(400, { error: 'Slug is already in use.' });
			throw e;
		}
		return { success: true, message: 'Specialty created.' };
	},

	update: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const fd = await request.formData();
		const entity = readEntityId(fd, 'specialty');
		if ('status' in entity) return entity;
		const parsed = parseSpecialistForm(fd);
		if ('error' in parsed) return fail(400, { error: parsed.error });
		let result;
		try {
			result = await db.update(specialists).set(parsed).where(eq(specialists.id, entity.id)).returning();
		} catch (e) {
			if (isUniqueViolation(e)) return fail(400, { error: 'Slug is already in use by another specialty.' });
			throw e;
		}
		if (result.length === 0) return fail(404, { error: 'Specialty not found.' });
		return { success: true, message: 'Specialty updated.' };
	},

	delete: async ({ request, locals }) => {
		const denied = denyUnlessManager(locals);
		if (denied) return denied;
		const entity = readEntityId(await request.formData(), 'specialty');
		if ('status' in entity) return entity;
		const result = await withFkGuard(
			() => db.delete(specialists).where(eq(specialists.id, entity.id)).returning(),
			409,
			'Specialty still has doctors. Remove or reassign them first.'
		);
		if ('status' in result) return result;
		if (result.length === 0) return fail(404, { error: 'Specialty not found.' });
		return { success: true, message: 'Specialty deleted.' };
	}
};
