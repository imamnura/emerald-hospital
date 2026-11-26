import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
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
type ActionEvent = Parameters<(typeof actions)['updateStatus']>[0];
type Row = { id: string; patientName: string; doctorName: string; status: string; appointmentDate: string };
type LoadData = {
	bookings: Row[];
	total: number;
	page: number;
	pageSize: number;
	query: string;
	statusFilter: string;
	statusCounts: Record<string, number>;
};
const run = async (url: string) => (await load(ev({ url }))) as unknown as LoadData;
const act = async (o: Parameters<typeof makeEvent>[0]) => (await actions.updateStatus(ev(o))) as ActionResult;

beforeEach(() => reset());

async function seed() {
	const alice = await makeUser({ name: 'Alice' });
	const bruno = await makeUser({ name: 'Bruno' });
	const h = await makeHospital({ name: 'Harbor Hospital' });
	const cardio = await makeSpecialist({ name: 'Cardiology' });
	const derm = await makeSpecialist({ name: 'Dermatology' });
	const docX = await makeDoctor({ name: 'Dr Xavier', hospitalId: h.id, specialistId: cardio.id });
	const docY = await makeDoctor({ name: 'Dr Yara', specialistId: derm.id });
	const sX = await makeSchedule(docX.id);
	const sY = await makeSchedule(docY.id);
	const b1 = await makeBooking({ userId: alice.id, doctorId: docX.id, scheduleId: sX.id, appointmentDate: '2030-01-01', status: 'pending' });
	const b2 = await makeBooking({ userId: alice.id, doctorId: docY.id, scheduleId: sY.id, appointmentDate: '2030-01-03', status: 'confirmed' });
	const b3 = await makeBooking({ userId: bruno.id, doctorId: docX.id, scheduleId: sX.id, appointmentDate: '2030-01-02', appointmentTime: '10:00', status: 'pending' });
	const b4 = await makeBooking({ userId: bruno.id, doctorId: docY.id, scheduleId: sY.id, appointmentDate: '2030-01-02', appointmentTime: '09:00', status: 'cancelled' });
	return { b1, b2, b3, b4 };
}

describe('manager/bookings load', () => {
	it('lists newest first with status counts', async () => {
		const { b1, b2, b3, b4 } = await seed();
		const data = await run('/manager/bookings');
		expect(data).toMatchObject({ total: 4, page: 1, pageSize: 10, query: '', statusFilter: '' });
		expect(data.bookings.map((b) => b.id)).toEqual([b2.id, b3.id, b4.id, b1.id]);
		expect(data.bookings[0]).toMatchObject({ patientName: 'Alice', doctorName: 'Dr Yara' });
		expect(data.statusCounts).toEqual({ all: 4, pending: 2, confirmed: 1, cancelled: 1, completed: 0 });
	});

	it('filters by status while keeping tab counts stable; ignores invalid statuses', async () => {
		await seed();
		const pending = await run('/manager/bookings?status=pending');
		expect(pending).toMatchObject({ total: 2, statusFilter: 'pending' });
		expect(pending.bookings.every((b) => b.status === 'pending')).toBe(true);
		expect(pending.statusCounts).toEqual({ all: 4, pending: 2, confirmed: 1, cancelled: 1, completed: 0 });

		const bogus = await run('/manager/bookings?status=bogus');
		expect(bogus).toMatchObject({ total: 4, statusFilter: 'bogus' });
	});

	it.each([
		['patient name', 'bruno', 2],
		['doctor name', 'xavier', 2],
		['specialty', 'DERMA', 2],
		['hospital', 'harbor', 2],
		['nothing', 'zzz', 0]
	])('searches by %s and scopes the status counts to the search', async (_c, q, n) => {
		await seed();
		const data = await run(`/manager/bookings?q=${q}`);
		expect(data.total).toBe(n);
		expect(data.statusCounts.all).toBe(n);
	});

	it('combines q with status and paginates', async () => {
		await seed();
		const data = await run('/manager/bookings?q=%20bruno%20&status=cancelled');
		expect(data).toMatchObject({ total: 1, query: 'bruno' });
		expect(data.statusCounts).toEqual({ all: 2, pending: 1, confirmed: 0, cancelled: 1, completed: 0 });

		const p2 = await run('/manager/bookings?page=2&pageSize=3');
		expect(p2).toMatchObject({ total: 4, page: 2, pageSize: 3 });
		expect(p2.bookings).toHaveLength(1);
	});

	it('returns zero counts on an empty database', async () => {
		const data = await run('/manager/bookings');
		expect(data).toMatchObject({ total: 0, bookings: [] });
		expect(data.statusCounts).toEqual({ all: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 });
	});
});

describe('manager/bookings updateStatus', () => {
	const statusOf = async (id: string) =>
		(await db.select().from(bookings).where(eq(bookings.id, id)))[0].status;

	it('rejects non-managers with 403 and changes nothing', async () => {
		const { b1 } = await seed();
		for (const user of await nonManagers()) {
			expect(await act({ user, form: { id: b1.id, status: 'confirmed' } })).toMatchObject({
				status: 403,
				data: { error: 'Manager access required.' }
			});
		}
		expect(await statusOf(b1.id)).toBe('pending');
	});

	it.each(['confirmed', 'completed', 'cancelled', 'pending'])('lets a manager set status to %s', async (status) => {
		const { b4 } = await seed();
		const user = await makeManager();
		expect(await act({ user, form: { id: b4.id, status } })).toEqual({ success: true, message: 'Status updated.' });
		expect(await statusOf(b4.id)).toBe(status);
	});

	it('validates id and status, and 404s for unknown ids', async () => {
		const { b1 } = await seed();
		const user = await makeManager();
		expect(await act({ user, form: { status: 'confirmed' } })).toEqual({ status: 400, data: { error: 'Missing booking ID.' } });
		expect(await act({ user, form: { id: b1.id, status: 'done' } })).toEqual({ status: 400, data: { error: 'Invalid status.' } });
		expect(await act({ user, form: { id: b1.id } })).toEqual({ status: 400, data: { error: 'Invalid status.' } });
		expect(await act({ user, form: { id: UNKNOWN_ID, status: 'confirmed' } })).toEqual({
			status: 404,
			data: { error: 'Booking not found.' }
		});
		expect(await statusOf(b1.id)).toBe('pending');
	});

	it('returns 404 for a non-UUID id and changes nothing', async () => {
		const { b1 } = await seed();
		const user = await makeManager();
		expect(await act({ user, form: { id: 'not-a-uuid', status: 'confirmed' } })).toEqual({
			status: 404,
			data: { error: 'Booking not found.' }
		});
		expect(await statusOf(b1.id)).toBe('pending');
	});
});
