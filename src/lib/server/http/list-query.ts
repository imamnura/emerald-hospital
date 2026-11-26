import { and, ilike, or, type AnyColumn, type SQL } from 'drizzle-orm';
import { isUuid } from '#lib/server/db/errors.ts';

/**
 * `ILIKE %q%` across `cols` (OR-ed), AND-ed with `extra`. Returns `undefined`
 * when there is no condition at all.
 */
export function searchWhere(q: string, cols: AnyColumn[], extra: (SQL | undefined)[] = []): SQL | undefined {
	const conditions: (SQL | undefined)[] = [];
	if (q) {
		const like = `%${q}%`;
		conditions.push(or(...cols.map((c) => ilike(c, like))));
	}
	conditions.push(...extra);
	return and(...conditions);
}

/** Runs the page query and its count query together. */
export async function paginate<T>(
	rows: Promise<T[]>,
	count: Promise<{ value: number }[]>
): Promise<{ rows: T[]; total: number }> {
	const [list, [{ value }]] = await Promise.all([rows, count]);
	return { rows: list, total: Number(value) };
}

/** A query-string id filter; anything that is not a UUID is ignored. */
export function uuidOrUndefined(v: string | null): string | undefined {
	return v && isUuid(v) ? v : undefined;
}
