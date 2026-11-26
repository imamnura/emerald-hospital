import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { doctorSchedules, doctors } from '#lib/server/db/schema.ts';
import {
	makeBooking,
	makeDoctor,
	makeEvent,
	makeHospital,
	makeManager,
	makeSchedule,
	makeSpecialist,
	makeUser
} from '#test/factories.ts';
import { ev, nonManagers, reset, UNKNOWN_ID, type ActionResult } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

type Event = Parameters<typeof load>[0];
type ActionEvent = Parameters<(typeof actions)['create']>[0];
type LoadData = {
	doctors: { name: string; hospital: string; specialty: string }[];
	total: number;
	page: number;
	pageSize: number;
	query: string;
	hospitalFilter: string;
	specialistFilter: string;
	hospitals: { id: string; name: string }[];
	specialists: { id: string; name: string }[];
};
const run = async (url: string) => (await load(ev({ url }))) as unknown as LoadData;
const act = async (name: 'create' | 'update' | 'delete', o: Parameters<typeof makeEvent>[0]) =>
	(await actions[name](ev(o))) as ActionResult;
const names = (d: LoadData) => d.doctors.map((x) => x.name);

beforeEach(() => reset());

async function seed() {
	const hA = await makeHospital({ name: 'Alpha Hospital' });
	const hB = await makeHospital({ name: 'Beta Hospital' });
	const cardio = await makeSpecialist({ name: 'Cardiology' });
	const derm = await makeSpecialist({ name: 'Dermatology' });
	await makeDoctor({ name: 'Dr Ann', hospitalId: hA.id, specialistId: cardio.id });
	await makeDoctor({ name: 'Dr Bob', hospitalId: hB.id, specialistId: cardio.id });
	await makeDoctor({ name: 'Dr Cat', hospitalId: hB.id, specialistId: derm.id });
	return { hA, hB, cardio, derm };
}

describe('manager/doctors load', () => {
	it('lists doctors with joined hospital/specialty and filter options', async () => {
		await seed();
		const data = await run('/manager/doctors');
		expect(data).toMatchObject({ total: 3, page: 1, pageSize: 10, query: '', hospitalFilter: '', specialistFilter: '' });
		expect(names(data)).toEqual(['Dr Ann', 'Dr Bob', 'Dr Cat']);
		expect(data.doctors[0]).toMatchObject({ hospital: 'Alpha Hospital', specialty: 'Cardiology' });
		expect(data.hospitals.map((h) => h.name)).toEqual(['Alpha Hospital', 'Beta Hospital']);
		expect(data.specialists.map((s) => s.name)).toEqual(['Cardiology', 'Dermatology']);
	});

	it('ignores a non-uuid hospital or specialty filter instead of erroring', async () => {
		await seed();
		const data = await run('/manager/doctors?hospitalId=abc&specialistId=xyz');
		expect(data).toMatchObject({ total: 3, hospitalFilter: 'abc', specialistFilter: 'xyz' });
		expect(names(data)).toEqual(['Dr Ann', 'Dr Bob', 'Dr Cat']);
	});

	it('searches by doctor, specialty or hospital name', async () => {
		await seed();
		expect(names(await run('/manager/doctors?q=bob'))).toEqual(['Dr Bob']);
		expect(names(await run('/manager/doctors?q=derma'))).toEqual(['Dr Cat']);
		expect(names(await run('/manager/doctors?q=%20alpha%20'))).toEqual(['Dr Ann']);
	});

	it('filters by hospital and specialty, combined with q and pagination', async () => {
		const { hB, cardio } = await seed();
		const byH = await run(`/manager/doctors?hospitalId=${hB.id}`);
		expect(byH).toMatchObject({ total: 2, hospitalFilter: hB.id });
		expect(names(byH)).toEqual(['Dr Bob', 'Dr Cat']);

		const both = await run(`/manager/doctors?hospitalId=${hB.id}&specialistId=${cardio.id}`);
		expect(both).toMatchObject({ total: 1, specialistFilter: cardio.id });
		expect(names(both)).toEqual(['Dr Bob']);

		expect(names(await run(`/manager/doctors?specialistId=${cardio.id}&q=ann`))).toEqual(['Dr Ann']);

		const p2 = await run('/manager/doctors?page=2&pageSize=2');
		expect(p2).toMatchObject({ total: 3, page: 2, pageSize: 2 });
		expect(names(p2)).toEqual(['Dr Cat']);
	});
});

describe('manager/doctors actions', () => {
	let hospitalId: string;
	let specialistId: string;
	const base = () => ({
		name: 'Dr New',
		hospitalId,
		specialistId,
		imageUrl: '',
		rating: '4.8',
		isActive: 'on',
		bio: ' Kind ',
		consultationFee: '200'
	});

	beforeEach(async () => {
		hospitalId = (await makeHospital()).id;
		specialistId = (await makeSpecialist()).id;
	});

	it.each(['create', 'update', 'delete'] as const)('%s rejects non-managers with 403 and changes nothing', async (name) => {
		const d = await makeDoctor({ name: 'Keep', hospitalId, specialistId });
		for (const user of await nonManagers()) {
			expect(await act(name, { user, form: { ...base(), id: d.id } })).toMatchObject({
				status: 403,
				data: { error: 'Manager access required.' }
			});
		}
		const rows = await db.select().from(doctors);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('Keep');
	});

	it('creates with all fields, updates, and deletes as a manager', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: base() })).toEqual({ success: true, message: 'Doctor created.' });
		const [row] = await db.select().from(doctors);
		expect(row).toMatchObject({
			name: 'Dr New',
			imageUrl: null,
			rating: '4.8',
			isActive: true,
			bio: 'Kind',
			consultationFee: '200.00'
		});

		const { isActive: _a, ...rest } = base();
		expect(
			await act('update', { user, form: { ...rest, id: row.id, name: 'Dr Renamed', bio: '', rating: '3', consultationFee: '99.5', imageUrl: 'http://img' } })
		).toEqual({ success: true, message: 'Doctor updated.' });
		const [upd] = await db.select().from(doctors).where(eq(doctors.id, row.id));
		expect(upd).toMatchObject({
			name: 'Dr Renamed',
			isActive: false, // unchecked checkbox → absent field
			bio: null,
			rating: '3.0',
			consultationFee: '99.50',
			imageUrl: 'http://img'
		});

		expect(await act('delete', { user, form: { id: row.id } })).toEqual({ success: true, message: 'Doctor deleted.' });
		expect(await db.select().from(doctors)).toHaveLength(0);
	});

	it('defaults rating to 4.5 and keeps the DB default fee when the fee is blank', async () => {
		const user = await makeManager();
		const form = { name: 'Dr Min', hospitalId, specialistId };
		expect(await act('create', { user, form })).toMatchObject({ success: true });
		const [row] = await db.select().from(doctors);
		expect(row).toMatchObject({ rating: '4.5', consultationFee: '150.00', isActive: false, bio: null, imageUrl: null });

		// A blank fee on update leaves the existing fee untouched.
		await db.update(doctors).set({ consultationFee: '321.00' }).where(eq(doctors.id, row.id));
		expect(await act('update', { user, form: { ...form, id: row.id, consultationFee: '  ' } })).toMatchObject({ success: true });
		const [upd] = await db.select().from(doctors);
		expect(upd.consultationFee).toBe('321.00');
	});

	it.each([
		['missing name', { name: '' }, 'Name, hospital, and specialty are required.'],
		['missing hospital', { hospitalId: '' }, 'Name, hospital, and specialty are required.'],
		['missing specialty', { specialistId: ' ' }, 'Name, hospital, and specialty are required.'],
		['non-numeric rating', { rating: 'abc' }, 'Rating must be between 0 and 5.'],
		['rating above 5', { rating: '5.1' }, 'Rating must be between 0 and 5.'],
		['negative rating', { rating: '-1' }, 'Rating must be between 0 and 5.'],
		['non-numeric fee', { consultationFee: 'free' }, 'Consultation fee must be a number.']
	])('create fails validation: %s', async (_c, patch, error) => {
		const user = await makeManager();
		expect(await act('create', { user, form: { ...base(), ...patch } })).toEqual({ status: 400, data: { error } });
		expect(await db.select().from(doctors)).toHaveLength(0);
	});

	it('create fails validation when every field is absent', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: { unrelated: '1' } })).toEqual({
			status: 400,
			data: { error: 'Name, hospital, and specialty are required.' }
		});
	});

	it('accepts the rating boundaries 0 and 5', async () => {
		const user = await makeManager();
		expect(await act('create', { user, form: { ...base(), rating: '0' } })).toMatchObject({ success: true });
		expect(await act('create', { user, form: { ...base(), rating: '5' } })).toMatchObject({ success: true });
		const ratings = (await db.select().from(doctors)).map((d) => d.rating).sort();
		expect(ratings).toEqual(['0.0', '5.0']);
	});

	it('update validates id and fields, and 404s for unknown ids', async () => {
		const user = await makeManager();
		const d = await makeDoctor({ name: 'Orig', hospitalId, specialistId });
		expect(await act('update', { user, form: base() })).toEqual({ status: 400, data: { error: 'Missing doctor ID.' } });
		expect(await act('update', { user, form: { ...base(), id: d.id, rating: '9' } })).toEqual({
			status: 400,
			data: { error: 'Rating must be between 0 and 5.' }
		});
		expect(await act('update', { user, form: { ...base(), id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Doctor not found.' }
		});
		const [row] = await db.select().from(doctors);
		expect(row.name).toBe('Orig');
	});

	it('delete validates id and 404s for unknown ids', async () => {
		const user = await makeManager();
		await makeDoctor({ hospitalId, specialistId });
		expect(await act('delete', { user, form: { x: '1' } })).toEqual({ status: 400, data: { error: 'Missing doctor ID.' } });
		expect(await act('delete', { user, form: { id: UNKNOWN_ID } })).toEqual({
			status: 404,
			data: { error: 'Doctor not found.' }
		});
		expect(await db.select().from(doctors)).toHaveLength(1);
	});

	it('deleting a doctor cascades to its schedules', async () => {
		const user = await makeManager();
		const d = await makeDoctor({ hospitalId, specialistId });
		await makeSchedule(d.id);
		expect(await act('delete', { user, form: { id: d.id } })).toMatchObject({ success: true });
		expect(await db.select().from(doctorSchedules)).toHaveLength(0);
	});

	it('delete returns 409 and keeps the doctor when it still has bookings', async () => {
		const user = await makeManager();
		const patient = await makeUser();
		const d = await makeDoctor({ hospitalId, specialistId });
		const s = await makeSchedule(d.id);
		await makeBooking({ userId: patient.id, doctorId: d.id, scheduleId: s.id });
		expect(await act('delete', { user, form: { id: d.id } })).toEqual({
			status: 409,
			data: { error: 'Doctor has bookings and cannot be deleted. Mark them inactive instead.' }
		});
		expect(await db.select().from(doctors)).toHaveLength(1);
	});

	it.each([
		['non-existent hospital', { hospitalId: UNKNOWN_ID }],
		['non-existent specialty', { specialistId: UNKNOWN_ID }],
		['non-UUID hospital', { hospitalId: 'nope' }],
		['non-UUID specialty', { specialistId: 'nope' }]
	])('create returns 400 for a %s', async (_c, patch) => {
		const user = await makeManager();
		expect(await act('create', { user, form: { ...base(), ...patch } })).toEqual({
			status: 400,
			data: { error: 'Selected hospital or specialty no longer exists.' }
		});
		expect(await db.select().from(doctors)).toHaveLength(0);
	});

	it.each([
		['non-existent hospital', { hospitalId: UNKNOWN_ID }],
		['non-UUID specialty', { specialistId: 'nope' }]
	])('update returns 400 for a %s and leaves the doctor unchanged', async (_c, patch) => {
		const user = await makeManager();
		const d = await makeDoctor({ name: 'Orig', hospitalId, specialistId });
		expect(await act('update', { user, form: { ...base(), id: d.id, ...patch } })).toEqual({
			status: 400,
			data: { error: 'Selected hospital or specialty no longer exists.' }
		});
		const [row] = await db.select().from(doctors);
		expect(row).toMatchObject({ name: 'Orig', hospitalId, specialistId });
	});

	it.each(['update', 'delete'] as const)('%s returns 404 for a non-UUID id', async (name) => {
		const user = await makeManager();
		await makeDoctor({ name: 'Keep', hospitalId, specialistId });
		expect(await act(name, { user, form: { ...base(), id: 'not-a-uuid' } })).toEqual({
			status: 404,
			data: { error: 'Doctor not found.' }
		});
		const rows = await db.select().from(doctors);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('Keep');
	});

	it.each(['insert', 'update', 'delete'] as const)('re-throws non-FK errors from db.%s', async (method) => {
		const user = await makeManager();
		const d = await makeDoctor({ name: 'Keep', hospitalId, specialistId });
		const action = method === 'insert' ? 'create' : method;
		const spy = vi.spyOn(db, method).mockImplementationOnce(() => {
			throw new Error('boom');
		});
		try {
			await expect(act(action, { user, form: { ...base(), id: d.id } })).rejects.toThrow('boom');
		} finally {
			spy.mockRestore();
		}
		const rows = await db.select().from(doctors);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('Keep');
	});
});
