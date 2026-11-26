import { count, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { hospitals } from '#lib/server/db/schema.ts';
import { makeHospital } from '#test/factories.ts';
import { reset } from '#test/helpers/route.ts';
import { paginate, searchWhere, uuidOrUndefined } from './list-query.ts';

beforeEach(() => reset());

describe('searchWhere', () => {
	it('is undefined without a query or extras', () => {
		expect(searchWhere('', [hospitals.name])).toBeUndefined();
		expect(searchWhere('', [hospitals.name], [undefined])).toBeUndefined();
	});
	it('builds a condition for a query, extras, or both', () => {
		expect(searchWhere('a', [hospitals.name, hospitals.city])).toBeDefined();
		expect(searchWhere('', [hospitals.name], [eq(hospitals.city, 'x')])).toBeDefined();
		expect(searchWhere('a', [hospitals.name], [eq(hospitals.city, 'x')])).toBeDefined();
	});
	it('filters rows (case-insensitive, any column, AND extras)', async () => {
		await makeHospital({ name: 'Alpha', city: 'Jakarta' });
		await makeHospital({ name: 'Beta', city: 'Alpine' });
		await makeHospital({ name: 'Gamma', city: 'Jakarta' });
		const names = async (w: ReturnType<typeof searchWhere>) =>
			(await db.select({ n: hospitals.name }).from(hospitals).where(w).orderBy(hospitals.name)).map((r) => r.n);
		expect(await names(searchWhere('ALP', [hospitals.name, hospitals.city]))).toEqual(['Alpha', 'Beta']);
		expect(
			await names(searchWhere('alp', [hospitals.name, hospitals.city], [eq(hospitals.city, 'Jakarta')]))
		).toEqual(['Alpha']);
		expect(await names(searchWhere('', [hospitals.name], [eq(hospitals.city, 'Jakarta')]))).toEqual([
			'Alpha',
			'Gamma'
		]);
	});
});

describe('paginate', () => {
	it('returns rows and numeric total', async () => {
		for (const n of ['A', 'B', 'C']) await makeHospital({ name: n });
		const res = await paginate<{ name: string }>(
			db.select({ name: hospitals.name }).from(hospitals).orderBy(hospitals.name).limit(2).offset(1),
			db.select({ value: count() }).from(hospitals)
		);
		expect(res).toEqual({ rows: [{ name: 'B' }, { name: 'C' }], total: 3 });
	});
});

describe('uuidOrUndefined', () => {
	it('keeps uuids, drops everything else', () => {
		const id = '00000000-0000-4000-8000-000000000000';
		expect(uuidOrUndefined(id)).toBe(id);
		expect(uuidOrUndefined('abc')).toBeUndefined();
		expect(uuidOrUndefined('')).toBeUndefined();
		expect(uuidOrUndefined(null)).toBeUndefined();
	});
});
