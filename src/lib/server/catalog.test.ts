import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeDoctor, makeHospital, makeSchedule, makeSpecialist } from '../../test/factories.ts';
import { getSpecialistBySlug, listDoctorOptions, listHospitals, listSchedulesForDoctor, listSpecialists } from './catalog.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('catalog', () => {
	it('listHospitals orders by name', async () => {
		await makeHospital({ name: 'Zeta' });
		await makeHospital({ name: 'Alpha' });
		await makeHospital({ name: 'Mid' });
		expect((await listHospitals()).map((h) => h.name)).toEqual(['Alpha', 'Mid', 'Zeta']);
	});

	it('listSpecialists orders by name', async () => {
		await makeSpecialist({ name: 'Neurology' });
		await makeSpecialist({ name: 'Cardiology' });
		expect((await listSpecialists()).map((s) => s.name)).toEqual(['Cardiology', 'Neurology']);
	});

	it('returns empty lists when nothing exists', async () => {
		expect(await listHospitals()).toEqual([]);
		expect(await listSpecialists()).toEqual([]);
	});

	it('getSpecialistBySlug finds by slug or returns null', async () => {
		const s = await makeSpecialist({ name: 'Cardiology', slug: 'cardio' });
		expect(await getSpecialistBySlug('cardio')).toEqual(s);
		expect(await getSpecialistBySlug('missing')).toBeNull();
	});

	it('listSchedulesForDoctor only returns that doctor schedules', async () => {
		const d1 = await makeDoctor();
		const d2 = await makeDoctor();
		const s1 = await makeSchedule(d1.id, { dayOfWeek: 1 });
		const s2 = await makeSchedule(d1.id, { dayOfWeek: 3 });
		await makeSchedule(d2.id);
		const rows = await listSchedulesForDoctor(d1.id);
		expect(rows.map((r) => r.id).sort()).toEqual([s1.id, s2.id].sort());
		expect(await listSchedulesForDoctor('00000000-0000-0000-0000-000000000000')).toEqual([]);
		expect(await listSchedulesForDoctor('not-a-uuid')).toEqual([]);
	});

	it('listDoctorOptions returns id and name ordered by name', async () => {
		const z = await makeDoctor({ name: 'Dr Zed' });
		const a = await makeDoctor({ name: 'Dr Amy' });
		expect(await listDoctorOptions()).toEqual([
			{ id: a.id, name: 'Dr Amy' },
			{ id: z.id, name: 'Dr Zed' }
		]);
	});
});
