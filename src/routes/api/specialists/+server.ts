import { json } from '@sveltejs/kit';
import { asc, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.ts';
import { specialists } from '#lib/server/db/schema.ts';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const limitParam = Number(url.searchParams.get('limit') ?? '8');
	const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 8, 1), 20);

	const rows = await db
		.select({ name: specialists.name, slug: specialists.slug })
		.from(specialists)
		.where(q ? ilike(specialists.name, `%${q}%`) : undefined)
		.orderBy(asc(specialists.name))
		.limit(limit);

	return json(rows);
};
