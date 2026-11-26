import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeBooking, makeDoctor, makeManager, makeSchedule, makeUser } from '#test/factories.ts';
import { ev, randomId, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

async function seed() {
	const user = await makeUser();
	const other = await makeUser();
	const doctor = await makeDoctor();
	const schedule = await makeSchedule(doctor.id);
	const mk = (userId: string, status?: 'pending' | 'cancelled' | 'completed') =>
		makeBooking({ userId, doctorId: doctor.id, scheduleId: schedule.id, status });
	return { user, other, mk };
}

type Data = { appointments: { id: string }[]; confirmedBooking: { id: string } | null };

describe('appointments load', () => {
	it('guards anonymous users and managers', async () => {
		expect(await thrown(() => load(ev({ url: '/appointments' })))).toMatchObject({
			status: 303,
			location: '/login?redirect=/appointments'
		});
		const manager = await makeManager();
		expect(await thrown(() => load(ev({ url: '/appointments', user: manager })))).toMatchObject({
			location: '/manager'
		});
	});

	it('lists own appointments and resolves the ?booked confirmation', async () => {
		const { user, other, mk } = await seed();
		const mine = await mk(user.id);
		const theirs = await mk(other.id);

		const plain = (await load(ev({ url: '/appointments', user }))) as Data;
		expect(plain.appointments.map((a) => a.id)).toEqual([mine.id]);
		expect(plain.confirmedBooking).toBeNull();

		const booked = (await load(ev({ url: `/appointments?booked=${mine.id}`, user }))) as Data;
		expect(booked.confirmedBooking?.id).toBe(mine.id);

		const foreign = (await load(ev({ url: `/appointments?booked=${theirs.id}`, user }))) as Data;
		expect(foreign.confirmedBooking).toBeNull();
	});
});

describe('appointments cancel action', () => {
	it('rejects anonymous users and managers', async () => {
		expect(await actions.cancel(ev({ form: { bookingId: 'x' } }))).toMatchObject({ status: 401 });
		const manager = await makeManager();
		expect(await actions.cancel(ev({ user: manager, form: { bookingId: 'x' } }))).toMatchObject({
			status: 403
		});
	});

	it('validates the booking id', async () => {
		const user = await makeUser();
		expect(await actions.cancel(ev({ user, form: { bookingId: '' } }))).toMatchObject({
			status: 400,
			data: { message: 'Invalid appointment.' }
		});
		expect(await actions.cancel(ev({ user, form: { other: '1' } }))).toMatchObject({ status: 400 });
	});

	it('maps every cancel failure', async () => {
		const { user, other, mk } = await seed();
		const cancelled = await mk(user.id, 'cancelled');
		const completed = await mk(user.id, 'completed');
		const foreign = await mk(other.id);

		const cancel = (bookingId: string) => actions.cancel(ev({ user, form: { bookingId } }));
		expect(await cancel(randomId())).toMatchObject({ data: { message: 'Appointment not found.' } });
		expect(await cancel(foreign.id)).toMatchObject({ data: { message: 'Appointment not found.' } });
		// A malformed id is treated as not found rather than surfacing a raw Postgres error.
		expect(await cancel('not-a-uuid')).toEqual(await cancel(randomId()));
		expect(await cancel('not-a-uuid')).toMatchObject({ data: { message: 'Appointment not found.' } });
		expect(await cancel(cancelled.id)).toMatchObject({
			data: { message: 'This appointment is already cancelled.' }
		});
		expect(await cancel(completed.id)).toMatchObject({
			data: { message: 'Completed appointments cannot be cancelled.' }
		});
	});

	it('cancels a pending appointment', async () => {
		const { user, mk } = await seed();
		const b = await mk(user.id);
		expect(await actions.cancel(ev({ user, form: { bookingId: b.id } }))).toEqual({ success: true });
		const [row] = await db.select().from(bookings).where(eq(bookings.id, b.id));
		expect(row.status).toBe('cancelled');
	});
});
