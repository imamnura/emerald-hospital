import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { doctorSchedules } from '#lib/server/db/schema.ts';
import { makeBooking, makeDoctor, makeEvent, makeManager, makeSchedule, makeUser } from '#test/factories.ts';
import { ev, nonManagers, reset, UNKNOWN_ID, type ActionResult } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

type Event = Parameters<typeof load>[0];
type ActionEvent = Parameters<(typeof actions)['create']>[0];
type Row = { doctorName: string; dayOfWeek: number; startTime: string };
type LoadData = {
	schedules: Row[];
	total: number;
	page: number;
	pageSize: number;
	query: string;
	doctorFilter: string;
	doctors: { id: string; name: string }[];
};
const run = async (url: string) => (await load(ev({ url }))) as unknown as LoadData;
const act = async (name: 'create' | 'update' | 'delete', o: Parameters<typeof makeEvent>[0]) =>
	(await actions[name](ev(o))) as ActionResult;
const keys = (d: LoadData) => d.schedules.map((s) => `${s.doctorName}/${s.dayOfWeek}/${s.startTime}`);

beforeEach(() => reset());

describe('manager/schedules load', () => {
	async function seed() {
		const ann = await makeDoctor({ name: 'Dr Ann' });
		const bob = await makeDoctor({ name: 'Dr Bob' });
		await makeSchedule(bob.id, { dayOfWeek: 2, startTime: '08:00', endTime: '09:00' });
		await makeSchedule(ann.id, { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' });
		await makeSchedule(ann.id, { dayOfWeek: 1, startTime: '13:00', endTime: '14:00' });
		await makeSchedule(ann.id, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
		return { ann, bob };
	}

	it('lists schedules sorted by doctor, day, start time with the doctor options', async () => {
		await seed();
		const data = await run('/manager/schedules');
		expect(data).toMatchObject({ total: 4, page: 1, pageSize: 10, query: '', doctorFilter: '' });
		expect(keys(data)).toEqual(['Dr Ann/1/09:00', 'Dr Ann/1/13:00', 'Dr Ann/3/10:00', 'Dr Bob/2/08:00']);
		expect(data.doctors.map((d) => d.name)).toEqual(['Dr Ann', 'Dr Bob']);
	});

	it('searches by doctor name, filters by doctorId, and paginates', async () => {
		const { ann, bob } = await seed();
		expect(keys(await run('/manager/schedules?q=%20BOB%20'))).toEqual(['Dr Bob/2/08:00']);

		const byDoc = await run(`/manager/schedules?doctorId=${ann.id}`);
		expect(byDoc).toMatchObject({ total: 3, doctorFilter: ann.id });

		const none = await run(`/manager/schedules?doctorId=${bob.id}&q=ann`);
		expect(none).toMatchObject({ total: 0, schedules: [] });

		const p2 = await run('/manager/schedules?page=2&pageSize=3');
		expect(p2).toMatchObject({ total: 4, page: 2, pageSize: 3 });
		expect(keys(p2)).toEqual(['Dr Bob/2/08:00']);
	});

	it('ignores a non-uuid doctor filter instead of erroring', async () => {
		await seed();
		const data = await run('/manager/schedules?doctorId=abc');
		expect(data).toMatchObject({ total: 4, doctorFilter: 'abc' });
	});
});

describe('manager/schedules actions', () => {
	let doctorId: string;
	const form = () => ({ doctorId, dayOfWeek: '2', startTime: '08:00:00', endTime: '10:30', maxQuota: '4' });

	beforeEach(async () => {
		doctorId = (await makeDoctor()).id;
	});

	it.each(['create', 'update', 'delete'] as const)('%s rejects non-managers with 403 and changes nothing', async (name) => {
		const s = await makeSchedule(doctorId, { maxQuota: 7 });
		for (const user of await nonManagers()) {
			expect(await act(name, { user, form: { ...form(), id: s.id } })).toMatchObject({
				status: 403,
				data: { error: 'Manager access required.' }
			});
		}
		const rows = await db.select().from(doctorSchedules);
		expect(rows).toHaveLength(1);
		expect(rows[0].maxQuota).toBe(7);
	});

	it('creates, updates and deletes as a manager', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: form() })).toEqual({ success: true, message: 'Schedule created.' });
		const [row] = await db.select().from(doctorSchedules);
		// seconds are trimmed off HH:MM:SS input
		expect(row).toMatchObject({ doctorId, dayOfWeek: 2, startTime: '08:00', endTime: '10:30', maxQuota: 4 });

		expect(
			await act('update', { user, form: { ...form(), id: row.id, dayOfWeek: '6', startTime: '13:00', endTime: '15:00' } })
		).toEqual({ success: true, message: 'Schedule updated.' });
		const [upd] = await db.select().from(doctorSchedules).where(eq(doctorSchedules.id, row.id));
		expect(upd).toMatchObject({ dayOfWeek: 6, startTime: '13:00', endTime: '15:00' });

		expect(await act('delete', { user, form: { id: row.id } })).toEqual({ success: true, message: 'Schedule deleted.' });
		expect(await db.select().from(doctorSchedules)).toHaveLength(0);
	});

	it('defaults maxQuota to 5 when omitted', async () => {
		const user = await makeManager();
		const { maxQuota: _q, ...rest } = form();
		expect(await act('create', { user, form: { ...rest, dayOfWeek: '0' } })).toMatchObject({ success: true });
		const [row] = await db.select().from(doctorSchedules);
		expect(row).toMatchObject({ maxQuota: 5, dayOfWeek: 0 });
	});

	it.each([
		['missing doctor', { doctorId: '' }, 'Doctor is required.'],
		['day above 6', { dayOfWeek: '7' }, 'Day of week must be 0–6.'],
		['negative day', { dayOfWeek: '-1' }, 'Day of week must be 0–6.'],
		['fractional day', { dayOfWeek: '1.5' }, 'Day of week must be 0–6.'],
		['non-numeric day', { dayOfWeek: 'mon' }, 'Day of week must be 0–6.'],
		['bad start time', { startTime: '8am' }, 'Times must be HH:MM.'],
		['bad end time', { endTime: '' }, 'Times must be HH:MM.'],
		['start equals end', { startTime: '10:00', endTime: '10:00' }, 'Start time must be before end time.'],
		['start after end', { startTime: '11:00', endTime: '10:00' }, 'Start time must be before end time.'],
		['zero quota', { maxQuota: '0' }, 'Max quota must be at least 1.'],
		['fractional quota', { maxQuota: '1.5' }, 'Max quota must be at least 1.'],
		['non-numeric quota', { maxQuota: 'lots' }, 'Max quota must be at least 1.']
	])('create fails validation: %s', async (_c, patch, error) => {
		const user = await makeManager();
		expect(await act('create', { user, form: { ...form(), ...patch } })).toEqual({ status: 400, data: { error } });
		expect(await db.select().from(doctorSchedules)).toHaveLength(0);
	});

	it('create without doctor/time fields reports the doctor first', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: { dayOfWeek: '1' } })).toEqual({
			status: 400,
			data: { error: 'Doctor is required.' }
		});
		expect(await act('create', { user, form: { doctorId, dayOfWeek: '1' } })).toEqual({
			status: 400,
			data: { error: 'Times must be HH:MM.' }
		});
	});

	it.each([
		['missing', undefined],
		['empty', ''],
		['blank', '   ']
	])('create rejects a %s dayOfWeek instead of defaulting to Sunday', async (_c, day) => {
		const user = await makeManager();
		const { dayOfWeek: _d, ...rest } = form();
		const f: Record<string, string> = day === undefined ? rest : { ...rest, dayOfWeek: day };
		expect(await act('create', { user, form: f })).toEqual({ status: 400, data: { error: 'Day of week must be 0–6.' } });
		expect(await db.select().from(doctorSchedules)).toHaveLength(0);
	});

	it.each([
		['non-existent', UNKNOWN_ID],
		['non-UUID', 'not-a-uuid']
	])('create returns 400 for a %s doctor', async (_c, id) => {
		const user = await makeManager();
		expect(await act('create', { user, form: { ...form(), doctorId: id } })).toEqual({
			status: 400,
			data: { error: 'Selected doctor no longer exists.' }
		});
		expect(await db.select().from(doctorSchedules)).toHaveLength(0);
	});

	it('update returns 400 for a well-formed but non-existent doctor and keeps the schedule', async () => {
		const user = await makeManager();
		const s = await makeSchedule(doctorId, { maxQuota: 9 });
		expect(await act('update', { user, form: { ...form(), id: s.id, doctorId: UNKNOWN_ID } })).toEqual({
			status: 400,
			data: { error: 'Selected doctor no longer exists.' }
		});
		const [row] = await db.select().from(doctorSchedules);
		expect(row).toMatchObject({ doctorId, maxQuota: 9 });
	});

	it.each(['update', 'delete'] as const)('%s returns 404 for a non-UUID id', async (name) => {
		const user = await makeManager();
		await makeSchedule(doctorId, { maxQuota: 9 });
		expect(await act(name, { user, form: { ...form(), id: 'not-a-uuid' } })).toEqual({
			status: 404,
			data: { error: 'Schedule not found.' }
		});
		const rows = await db.select().from(doctorSchedules);
		expect(rows).toHaveLength(1);
		expect(rows[0].maxQuota).toBe(9);
	});

	it.each(['insert', 'update', 'delete'] as const)('re-throws non-FK errors from db.%s', async (method) => {
		const user = await makeManager();
		const s = await makeSchedule(doctorId, { maxQuota: 9 });
		const action = method === 'insert' ? 'create' : method;
		const spy = vi.spyOn(db, method).mockImplementationOnce(() => {
			throw new Error('boom');
		});
		try {
			await expect(act(action, { user, form: { ...form(), id: s.id } })).rejects.toThrow('boom');
		} finally {
			spy.mockRestore();
		}
		const rows = await db.select().from(doctorSchedules);
		expect(rows).toHaveLength(1);
		expect(rows[0].maxQuota).toBe(9);
	});

	it('update validates id and fields, and 404s for unknown ids', async () => {
		const user = await makeManager();
		const s = await makeSchedule(doctorId, { maxQuota: 9 });
		expect(await act('update', { user, form: form() })).toEqual({ status: 400, data: { error: 'Missing schedule ID.' } });
		expect(await act('update', { user, form: { ...form(), id: s.id, maxQuota: '0' } })).toEqual({
			status: 400,
			data: { error: 'Max quota must be at least 1.' }
		});
		expect(await act('update', { user, form: { ...form(), id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Schedule not found.' }
		});
		const [row] = await db.select().from(doctorSchedules);
		expect(row.maxQuota).toBe(9);
	});

	it('delete validates id and 404s for unknown ids', async () => {
		const user = await makeManager();
		await makeSchedule(doctorId);
		expect(await act('delete', { user, form: { x: '1' } })).toEqual({ status: 400, data: { error: 'Missing schedule ID.' } });
		expect(await act('delete', { user, form: { id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Schedule not found.' }
		});
		expect(await db.select().from(doctorSchedules)).toHaveLength(1);
	});

	it('delete returns 409 and keeps the schedule when it still has bookings', async () => {
		const user = await makeManager();
		const patient = await makeUser();
		const s = await makeSchedule(doctorId);
		await makeBooking({ userId: patient.id, doctorId, scheduleId: s.id });
		expect(await act('delete', { user, form: { id: s.id } })).toEqual({
			status: 409,
			data: { error: 'Schedule has bookings and cannot be deleted.' }
		});
		expect(await db.select().from(doctorSchedules)).toHaveLength(1);
	});
});
