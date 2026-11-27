import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { specialists } from '#lib/server/db/schema.ts';
import { makeDoctor, makeEvent, makeManager, makeSpecialist } from '#test/factories.ts';
import { ev, nonManagers, reset, UNKNOWN_ID, type ActionResult } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

type LoadData = { specialists: { name: string; slug: string }[]; total: number; page: number; pageSize: number; query: string };
const run = async (url: string) => (await load(ev({ url }))) as unknown as LoadData;
const act = async (name: 'create' | 'update' | 'delete', o: Parameters<typeof makeEvent>[0]) =>
	(await actions[name](ev(o))) as ActionResult;

beforeEach(() => reset());

describe('manager/specialists load', () => {
	it('lists sorted by name with pagination defaults', async () => {
		await makeSpecialist({ name: 'Neurology', slug: 'neuro' });
		await makeSpecialist({ name: 'Cardiology', slug: 'cardio' });
		const data = await run('/manager/specialists');
		expect(data).toMatchObject({ total: 2, page: 1, pageSize: 10, query: '' });
		expect(data.specialists.map((s) => s.name)).toEqual(['Cardiology', 'Neurology']);
	});

	it('searches by name or slug and paginates', async () => {
		await makeSpecialist({ name: 'Neurology', slug: 'brain' });
		await makeSpecialist({ name: 'Cardiology', slug: 'heart' });
		await makeSpecialist({ name: 'Dermatology', slug: 'skin' });

		expect((await run('/manager/specialists?q=BRAIN')).specialists.map((s) => s.name)).toEqual(['Neurology']);
		expect((await run('/manager/specialists?q=cardio')).specialists.map((s) => s.name)).toEqual(['Cardiology']);
		const p = await run('/manager/specialists?page=2&pageSize=2');
		expect(p).toMatchObject({ total: 3, page: 2, pageSize: 2 });
		expect(p.specialists.map((s) => s.name)).toEqual(['Neurology']);
	});
});

describe('manager/specialists actions', () => {
	const form = { name: 'Oncology', slug: 'oncology', icon: 'ribbon' };

	it.each(['create', 'update', 'delete'] as const)('%s rejects non-managers with 403 and changes nothing', async (name) => {
		const s = await makeSpecialist({ name: 'Keep', slug: 'keep' });
		for (const user of await nonManagers()) {
			expect(await act(name, { user, form: { ...form, id: s.id } })).toMatchObject({
				status: 403,
				data: { error: 'Manager access required.' }
			});
		}
		const rows = await db.select().from(specialists);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ name: 'Keep', slug: 'keep' });
	});

	it('creates, updates and deletes as a manager', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form })).toEqual({ success: true, message: 'Specialty created.' });
		const [row] = await db.select().from(specialists);
		expect(row).toMatchObject({ name: 'Oncology', slug: 'oncology', icon: 'ribbon' });

		// Same slug as itself is allowed on update; slug is normalised.
		expect(
			await act('update', { user, form: { id: row.id, name: 'Onco', slug: '  --Child  Cancer!!--  ', icon: '' } })
		).toEqual({ success: true, message: 'Specialty updated.' });
		const [updated] = await db.select().from(specialists).where(eq(specialists.id, row.id));
		expect(updated).toMatchObject({ name: 'Onco', slug: 'child-cancer', icon: null });

		expect(await act('update', { user, form: { id: row.id, name: 'Onco', slug: 'child-cancer' } })).toMatchObject({
			success: true
		});

		expect(await act('delete', { user, form: { id: row.id } })).toEqual({ success: true, message: 'Specialty deleted.' });
		expect(await db.select().from(specialists)).toHaveLength(0);
	});

	it.each([
		['missing name', { slug: 'x' }, 'Name is required.'],
		['missing slug', { name: 'X' }, 'Slug is required.'],
		['slug that normalises to empty', { name: 'X', slug: '!!!' }, 'Slug is required.']
	])('create fails validation: %s', async (_c, bad, error) => {
		const user = await makeManager();
		expect(await act('create', { user, form: bad as Record<string, string> })).toEqual({ status: 400, data: { error } });
		expect(await db.select().from(specialists)).toHaveLength(0);
	});

	it('create rejects a duplicate slug', async () => {
		const user = await makeManager();
		await makeSpecialist({ slug: 'oncology' });
		expect(await act('create', { user, form: { ...form, slug: 'ONCOLOGY' } })).toEqual({
			status: 400,
			data: { error: 'Slug is already in use.' }
		});
		expect(await db.select().from(specialists)).toHaveLength(1);
	});

	it('update validates id, fields, slug uniqueness and 404s for unknown ids', async () => {
		const user = await makeManager();
		const a = await makeSpecialist({ name: 'A', slug: 'a' });
		await makeSpecialist({ name: 'B', slug: 'b' });

		expect(await act('update', { user, form })).toEqual({ status: 400, data: { error: 'Missing specialty ID.' } });
		expect(await act('update', { user, form: { id: a.id, slug: 'a' } })).toEqual({
			status: 400,
			data: { error: 'Name is required.' }
		});
		expect(await act('update', { user, form: { id: a.id, name: 'A', slug: 'b' } })).toEqual({
			status: 400,
			data: { error: 'Slug is already in use by another specialty.' }
		});
		expect(await act('update', { user, form: { ...form, id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Specialty not found.' }
		});
		const [row] = await db.select().from(specialists).where(eq(specialists.id, a.id));
		expect(row).toMatchObject({ name: 'A', slug: 'a' });
	});

	it('delete validates id and 404s for unknown ids', async () => {
		const user = await makeManager();
		await makeSpecialist();
		expect(await act('delete', { user, form: { x: '1' } })).toEqual({ status: 400, data: { error: 'Missing specialty ID.' } });
		expect(await act('delete', { user, form: { id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Specialty not found.' }
		});
		expect(await db.select().from(specialists)).toHaveLength(1);
	});

	it('delete returns 409 and keeps the specialty when it still has doctors', async () => {
		const user = await makeManager();
		const doctor = await makeDoctor();
		expect(await act('delete', { user, form: { id: doctor.specialistId } })).toEqual({
			status: 409,
			data: { error: 'Specialty still has doctors. Remove or reassign them first.' }
		});
		expect(await db.select().from(specialists)).toHaveLength(1);
	});

	it.each(['update', 'delete'] as const)('%s returns 404 for a non-UUID id without touching the DB', async (name) => {
		const user = await makeManager();
		await makeSpecialist({ name: 'Keep', slug: 'keep' });
		expect(await act(name, { user, form: { ...form, id: 'not-a-uuid' } })).toEqual({
			status: 404,
			data: { error: 'Specialty not found.' }
		});
		const rows = await db.select().from(specialists);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ name: 'Keep', slug: 'keep' });
	});

	it('delete re-throws errors that are not FK violations', async () => {
		const user = await makeManager();
		const s = await makeSpecialist();
		const spy = vi.spyOn(db, 'delete').mockImplementationOnce(() => {
			throw new Error('boom');
		});
		try {
			await expect(act('delete', { user, form: { id: s.id } })).rejects.toThrow('boom');
		} finally {
			spy.mockRestore();
		}
		expect(await db.select().from(specialists)).toHaveLength(1);
	});
});
