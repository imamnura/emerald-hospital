import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { hospitals } from '#lib/server/db/schema.ts';
import { makeDoctor, makeEvent, makeHospital, makeManager } from '#test/factories.ts';
import { ev, nonManagers, reset, UNKNOWN_ID, type ActionResult } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

type Event = Parameters<typeof load>[0];
type ActionEvent = Parameters<(typeof actions)['create']>[0];
type LoadData = { hospitals: { name: string }[]; total: number; page: number; pageSize: number; query: string };
const run = async (url: string) => (await load(ev({ url }))) as unknown as LoadData;
const act = async (name: 'create' | 'update' | 'delete', o: Parameters<typeof makeEvent>[0]) =>
	(await actions[name](ev(o))) as ActionResult;

beforeEach(() => reset());

describe('manager/hospitals load', () => {
	it('paginates and searches', async () => {
		await makeHospital({ name: 'Alpha General' });
		await makeHospital({ name: 'Beta Clinic', city: 'Bandung' });

		const all = await run('/manager/hospitals');
		expect(all).toMatchObject({ total: 2, page: 1, pageSize: 10, query: '' });

		const filtered = await run('/manager/hospitals?q=bandung');
		expect(filtered.hospitals.map((h) => h.name)).toEqual(['Beta Clinic']);
		expect(filtered).toMatchObject({ total: 1, query: 'bandung' });
	});

	it('matches by name and address, trims q, and paginates sorted by name', async () => {
		await makeHospital({ name: 'Charlie', address: 'Jl. Merdeka' });
		await makeHospital({ name: 'Alpha' });
		await makeHospital({ name: 'Bravo' });

		expect((await run('/manager/hospitals?q=%20merdeka%20')).hospitals.map((h) => h.name)).toEqual(['Charlie']);
		expect((await run('/manager/hospitals?q=brav')).hospitals.map((h) => h.name)).toEqual(['Bravo']);

		const p2 = await run('/manager/hospitals?page=2&pageSize=2');
		expect(p2).toMatchObject({ total: 3, page: 2, pageSize: 2 });
		expect(p2.hospitals.map((h) => h.name)).toEqual(['Charlie']);

		const none = await run('/manager/hospitals?q=zzz');
		expect(none).toMatchObject({ total: 0, hospitals: [] });
	});
});

describe('manager/hospitals actions', () => {
	const form = { name: 'New H', address: 'Jl. 1', city: 'Purwakarta', contact: '123', imageUrl: '' };

	it.each(['create', 'update', 'delete'] as const)('%s rejects non-managers with 403 and changes nothing', async (name) => {
		const h = await makeHospital({ name: 'Keep' });
		for (const user of await nonManagers()) {
			const res = await act(name, { user, form: { ...form, id: h.id } });
			expect(res).toMatchObject({ status: 403, data: { error: 'Manager access required.' } });
		}
		const rows = await db.select().from(hospitals);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('Keep');
	});

	it('creates, updates and deletes as a manager', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form })).toEqual({ success: true, message: 'Hospital created.' });
		const [row] = await db.select().from(hospitals);
		expect(row).toMatchObject({ name: 'New H', address: 'Jl. 1', city: 'Purwakarta', contact: '123', imageUrl: null });

		expect(
			await act('update', { user, form: { ...form, id: row.id, name: ' Renamed ', contact: '', imageUrl: 'http://x/y.png' } })
		).toEqual({ success: true, message: 'Hospital updated.' });
		const [renamed] = await db.select().from(hospitals).where(eq(hospitals.id, row.id));
		expect(renamed).toMatchObject({ name: 'Renamed', contact: null, imageUrl: 'http://x/y.png' });

		expect(await act('delete', { user, form: { id: row.id } })).toEqual({ success: true, message: 'Hospital deleted.' });
		expect(await db.select().from(hospitals)).toHaveLength(0);
	});

	it('creates with only the required fields', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: { name: 'N', address: 'A', city: 'C' } })).toMatchObject({ success: true });
		const [row] = await db.select().from(hospitals);
		expect(row).toMatchObject({ contact: null, imageUrl: null });
	});

	it.each([
		['name', { ...form, name: '  ' }],
		['address', { ...form, address: '' }],
		['city', { name: 'X', address: 'Y' }],
		['every field', { unrelated: '1' }]
	])('create fails validation when %s is missing', async (_f, bad) => {
		const user = await makeManager();
		expect(await act('create', { user, form: bad as Record<string, string> })).toEqual({
			status: 400,
			data: { error: 'Name, address, and city are required.' }
		});
		expect(await db.select().from(hospitals)).toHaveLength(0);
	});

	it('update validates id and fields, and 404s for unknown ids', async () => {
		const user = await makeManager();
		const h = await makeHospital({ name: 'Orig' });

		expect(await act('update', { user, form })).toEqual({ status: 400, data: { error: 'Missing hospital ID.' } });
		expect(await act('update', { user, form: { id: h.id, name: 'X' } })).toEqual({
			status: 400,
			data: { error: 'Name, address, and city are required.' }
		});
		expect(await act('update', { user, form: { ...form, id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Hospital not found.' }
		});
		const [row] = await db.select().from(hospitals);
		expect(row.name).toBe('Orig');
	});

	it('delete validates id and 404s for unknown ids', async () => {
		const user = await makeManager();
		await makeHospital();
		expect(await act('delete', { user, form: { other: 'x' } })).toEqual({ status: 400, data: { error: 'Missing hospital ID.' } });
		expect(await act('delete', { user, form: { id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Hospital not found.' }
		});
		expect(await db.select().from(hospitals)).toHaveLength(1);
	});

	it('delete returns 409 and keeps the hospital when it still has doctors', async () => {
		const user = await makeManager();
		const doctor = await makeDoctor();
		expect(await act('delete', { user, form: { id: doctor.hospitalId } })).toEqual({
			status: 409,
			data: { error: 'Hospital still has doctors. Remove or reassign them first.' }
		});
		expect(await db.select().from(hospitals)).toHaveLength(1);
	});

	it.each(['update', 'delete'] as const)('%s returns 404 for a non-UUID id without touching the DB', async (name) => {
		const user = await makeManager();
		await makeHospital({ name: 'Keep' });
		expect(await act(name, { user, form: { ...form, id: 'not-a-uuid' } })).toEqual({
			status: 404,
			data: { error: 'Hospital not found.' }
		});
		const rows = await db.select().from(hospitals);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('Keep');
	});

	it('delete re-throws errors that are not FK violations', async () => {
		const user = await makeManager();
		const h = await makeHospital();
		const spy = vi.spyOn(db, 'delete').mockImplementationOnce(() => {
			throw new Error('boom');
		});
		try {
			await expect(act('delete', { user, form: { id: h.id } })).rejects.toThrow('boom');
		} finally {
			spy.mockRestore();
		}
		expect(await db.select().from(hospitals)).toHaveLength(1);
	});
});
