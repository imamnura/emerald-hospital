import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import { makeBooking, makeDoctor, makeHospital, makeSchedule, makeUser } from '#test/factories.ts';
import { MONDAY, TUESDAY, ev, randomId, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

async function seed(maxQuota = 2) {
	const user = await makeUser();
	const hospital = await makeHospital({ address: 'Jl. Sudirman 1', city: 'Purwakarta' });
	const doctor = await makeDoctor({ hospitalId: hospital.id, consultationFee: '200.00' });
	const schedule = await makeSchedule(doctor.id, { dayOfWeek: 1, maxQuota });
	return { user, doctor, schedule };
}

const qs = (p: Record<string, string>) => `/x?${new URLSearchParams(p)}`;

describe('booking confirm load', () => {
	it('redirects back to the picker when any param is missing', async () => {
		const id = randomId();
		for (const p of [
			{ time: '09:00', scheduleId: 's' },
			{ date: MONDAY, scheduleId: 's' },
			{ date: MONDAY, time: '09:00' }
		] as Record<string, string>[]) {
			const r = await thrown(() => load(ev({ params: { id }, url: qs(p) })));
			expect(r).toMatchObject({ status: 303, location: `/doctors/${id}/book?date=${p.date ?? ''}` });
		}
	});

	it('redirects back to the picker when scheduleId is not a UUID', async () => {
		const { doctor } = await seed();
		const r = await thrown(() =>
			load(ev({ params: { id: doctor.id }, url: qs({ date: MONDAY, time: '09:00', scheduleId: 'not-a-uuid' }) }))
		);
		expect(r).toMatchObject({ status: 303, location: `/doctors/${doctor.id}/book?date=${MONDAY}` });
	});

	it('404s for unknown doctors', async () => {
		const url = qs({ date: MONDAY, time: '09:00', scheduleId: randomId() });
		expect(await thrown(() => load(ev({ params: { id: randomId() }, url })))).toMatchObject({
			status: 404
		});
	});

	it('redirects for unknown/foreign schedules, wrong weekday, full or nonexistent slots', async () => {
		const { user, doctor, schedule } = await seed(1);
		const otherDoctor = await makeDoctor();
		const foreign = await makeSchedule(otherDoctor.id, { dayOfWeek: 1 });
		await makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentTime: '09:00' });

		const back = `/doctors/${doctor.id}/book?date=`;
		for (const [p, date] of [
			[{ date: MONDAY, time: '09:30', scheduleId: randomId() }, MONDAY],
			[{ date: MONDAY, time: '09:30', scheduleId: foreign.id }, MONDAY],
			[{ date: TUESDAY, time: '09:30', scheduleId: schedule.id }, TUESDAY],
			[{ date: MONDAY, time: '09:00', scheduleId: schedule.id }, MONDAY],
			[{ date: MONDAY, time: '15:00', scheduleId: schedule.id }, MONDAY]
		] as const) {
			const r = await thrown(() => load(ev({ params: { id: doctor.id }, url: qs(p) })));
			expect(r).toMatchObject({ status: 303, location: back + date });
		}
	});

	it('returns the appointment summary for an open slot', async () => {
		const { user, doctor, schedule } = await seed();
		const data = (await load(
			ev({ user, params: { id: doctor.id }, url: qs({ date: MONDAY, time: '10:30', scheduleId: schedule.id }) })
		)) as Record<string, Record<string, unknown>>;
		expect(data.appointment).toEqual({
			date: MONDAY,
			time: '10:30',
			timeLabel: '10:30 AM',
			scheduleId: schedule.id,
			visitType: 'Initial Consultation'
		});
		expect(data.doctor).toMatchObject({ id: doctor.id, fee: 200, locationLine2: 'Jl. Sudirman 1, Purwakarta' });
		expect(data.doctor.role).toBeTruthy();
	});
});

describe('booking confirm action', () => {
	const form = (scheduleId: string, date = MONDAY, time = '09:00') => ({
		scheduleId,
		appointmentDate: date,
		appointmentTime: time
	});

	it('sends anonymous users to login with a return URL', async () => {
		const url = `/doctors/d1/book/confirm?date=${MONDAY}&time=09:00`;
		const r = await thrown(() => actions.default(ev({ url, params: { id: 'd1' }, form: form('s') })));
		expect(r.status).toBe(303);
		const back = new URL(r.location!, 'http://x').searchParams.get('redirect');
		expect(back).toBe(`/doctors/d1/book/confirm?date=${MONDAY}&time=09%3A00`);
	});

	it('requires all appointment fields', async () => {
		const user = await makeUser();
		for (const f of [
			{ appointmentDate: MONDAY, appointmentTime: '09:00' },
			{ scheduleId: 's', appointmentTime: '09:00' },
			{ scheduleId: 's', appointmentDate: MONDAY }
		] as Record<string, string>[]) {
			expect(await actions.default(ev({ user, params: { id: 'd' }, form: f }))).toMatchObject({
				status: 400,
				data: { error: 'Missing appointment details.' }
			});
		}
	});

	it('maps invalid schedule and full slot', async () => {
		const { user, doctor, schedule } = await seed(1);
		const run = (f: Record<string, string>) => actions.default(ev({ user, params: { id: doctor.id }, form: f }));

		expect(await run(form(schedule.id, TUESDAY))).toMatchObject({
			status: 400,
			data: { error: 'Invalid schedule for selected date.' }
		});

		await makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId: schedule.id });
		expect(await run(form(schedule.id))).toMatchObject({
			status: 400,
			data: { error: 'Selected slot is no longer available.' }
		});
	});

	it('books the slot and redirects to the confirmation', async () => {
		const { user, doctor, schedule } = await seed();
		const r = await thrown(() =>
			actions.default(ev({ user, params: { id: doctor.id }, form: form(schedule.id, MONDAY, '10:00') }))
		);
		expect(r.status).toBe(303);
		const id = r.location!.replace('/appointments?booked=', '');
		const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
		expect(row).toMatchObject({ userId: user.id, appointmentTime: '10:00', status: 'pending' });
	});
});
