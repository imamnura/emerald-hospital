import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeDoctor, makeHospital } from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

type Data = { doctors: { name: string }[]; hospital: string; query: string; hospitals: unknown[]; user: unknown };
const run = async (url: string, user: unknown = null) => (await load(ev({ url, user: user as never }))) as Data;

describe('find-doctor load', () => {
	beforeEach(async () => {
		const a = await makeHospital({ name: 'Siloam Purwakarta' });
		const b = await makeHospital({ name: 'Bayu Asih' });
		await makeDoctor({ name: 'Dr. Andi', hospitalId: a.id });
		await makeDoctor({ name: 'Dr. Budi', hospitalId: b.id });
	});

	it('returns everything by default', async () => {
		const user = { id: 'u' };
		const data = await run('/find-doctor', user);
		expect(data.doctors).toHaveLength(2);
		expect(data.hospitals).toHaveLength(2);
		expect(data).toMatchObject({ query: '', hospital: 'all', user });
	});

	it('filters by query and by hospital slug', async () => {
		expect((await run('/find-doctor?q=andi')).doctors.map((d) => d.name)).toEqual(['Dr. Andi']);
		const byHospital = await run('/find-doctor?hospital=bayu-asih');
		expect(byHospital.doctors.map((d) => d.name)).toEqual(['Dr. Budi']);
		expect(byHospital.hospital).toBe('bayu-asih');
	});

	it('ignores "all" and keeps results when hospital filter matches nothing', async () => {
		expect((await run('/find-doctor?hospital=all')).doctors).toHaveLength(2);
		expect((await run('/find-doctor?hospital=unknown')).doctors).toHaveLength(2);
	});
});
