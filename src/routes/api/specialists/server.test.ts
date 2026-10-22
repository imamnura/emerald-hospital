import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeSpecialist } from '../../../test/factories.ts';
import { ev } from '../../../test/helpers-routes-public.ts';
import { GET } from './+server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const get = async (url: string) => (await (await GET(ev({ url }))).json()) as { name: string; slug: string }[];

describe('GET /api/specialists', () => {
	beforeEach(async () => {
		for (const name of ['Cardiology', 'Dental', 'Dermatology', 'Neurology']) {
			await makeSpecialist({ name, slug: name.toLowerCase() });
		}
	});

	it('lists alphabetically with default limit', async () => {
		const rows = await get('/api/specialists');
		expect(rows.map((r) => r.name)).toEqual(['Cardiology', 'Dental', 'Dermatology', 'Neurology']);
		expect(rows[0]).toEqual({ name: 'Cardiology', slug: 'cardiology' });
	});

	it('filters case-insensitively by q', async () => {
		const rows = await get('/api/specialists?q=%20DE%20');
		expect(rows.map((r) => r.slug)).toEqual(['dental', 'dermatology']);
	});

	it('clamps limit to 1..20 and ignores non-numeric', async () => {
		expect(await get('/api/specialists?limit=0')).toHaveLength(1);
		expect(await get('/api/specialists?limit=2')).toHaveLength(2);
		expect(await get('/api/specialists?limit=999')).toHaveLength(4);
		expect(await get('/api/specialists?limit=abc')).toHaveLength(4);
	});
});
