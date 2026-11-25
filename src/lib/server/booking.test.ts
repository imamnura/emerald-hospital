import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import {
	makeBooking,
	makeDoctor,
	makeHospital,
	makeSchedule,
	makeSpecialist,
	makeUser
} from '../../test/factories.ts';
import {
	cancelBookingForUser,
	createBookingAtomic,
	generateTimeSlots,
	getAllSlotsForDoctorDate,
	getAppointmentForUser,
	getDayOfWeek,
	getSlotAvailability,
	listAppointmentsForUser
} from './booking.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

// 2030-01-07 is a Monday (dayOfWeek 1); 2030-01-08 is a Tuesday.
const MONDAY = '2030-01-07';
const TUESDAY = '2030-01-08';

async function setup(scheduleOverrides: Parameters<typeof makeSchedule>[1] = {}) {
	const user = await makeUser();
	const doctor = await makeDoctor();
	const schedule = await makeSchedule(doctor.id, scheduleOverrides);
	return { user, doctor, schedule };
}

describe('time helpers', () => {
	it('parses HH:MM to minutes and back (through generateTimeSlots)', () => {
		expect(generateTimeSlots('00:00', '00:01')).toEqual(['00:00']);
		expect(generateTimeSlots('09:30', '09:31')).toEqual(['09:30']);
		expect(generateTimeSlots('23:59', '24:00')).toEqual(['23:59']);
		expect(generateTimeSlots('01:05', '01:06')).toEqual(['01:05']);
		expect(generateTimeSlots('13:30', '13:31')).toEqual(['13:30']);
	});

	it('generateTimeSlots covers [start, end) at the interval', () => {
		expect(generateTimeSlots('09:00', '11:00')).toEqual(['09:00', '09:30', '10:00', '10:30']);
		expect(generateTimeSlots('09:00', '10:00', 15)).toEqual(['09:00', '09:15', '09:30', '09:45']);
		expect(generateTimeSlots('10:00', '10:00')).toEqual([]);
		expect(generateTimeSlots('11:00', '10:00')).toEqual([]);
	});

	it('getDayOfWeek returns the weekday of a date string', () => {
		expect(getDayOfWeek(MONDAY)).toBe(1);
		expect(getDayOfWeek(TUESDAY)).toBe(2);
		expect(getDayOfWeek('2030-01-06')).toBe(0);
		expect(getDayOfWeek('2026-10-17')).toBe(6);
	});

	it('getDayOfWeek is NaN for anything that is not strict YYYY-MM-DD', () => {
		expect(getDayOfWeek('2026-10-17T05:00:00')).toBeNaN();
		expect(getDayOfWeek('2026-1-5')).toBeNaN();
		expect(getDayOfWeek('garbage')).toBeNaN();
	});
});

describe('getSlotAvailability', () => {
	it('returns an empty map for an unknown schedule', async () => {
		const res = await getSlotAvailability('00000000-0000-0000-0000-000000000000', MONDAY);
		expect(res.size).toBe(0);
	});

	it('subtracts active bookings per slot, ignores cancelled ones, clamps at 0', async () => {
		const { user, doctor, schedule } = await setup({ maxQuota: 2 });
		const base = { userId: user.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentDate: MONDAY };
		await makeBooking({ ...base, appointmentTime: '09:00' });
		await makeBooking({ ...base, appointmentTime: '09:30', status: 'confirmed' });
		await makeBooking({ ...base, appointmentTime: '09:30', status: 'completed' });
		await makeBooking({ ...base, appointmentTime: '09:30', status: 'pending' }); // overbooked
		await makeBooking({ ...base, appointmentTime: '10:00', status: 'cancelled' });
		// Different date must not count.
		await makeBooking({ ...base, appointmentDate: '2030-01-14', appointmentTime: '10:30' });

		const res = await getSlotAvailability(schedule.id, MONDAY);
		expect(Object.fromEntries(res)).toEqual({
			'09:00': 1,
			'09:30': 0,
			'10:00': 2,
			'10:30': 2
		});
	});
});

describe('getAllSlotsForDoctorDate', () => {
	it('returns [] when no schedule matches the weekday', async () => {
		const { schedule } = await setup({ dayOfWeek: 1 });
		expect(await getAllSlotsForDoctorDate([schedule], TUESDAY)).toEqual([]);
	});

	it('merges overlapping schedules keeping the higher quota, sorted by time', async () => {
		const { user, doctor, schedule: a } = await setup({
			dayOfWeek: 1,
			startTime: '09:00',
			endTime: '10:00',
			maxQuota: 1
		});
		const b = await makeSchedule(doctor.id, {
			dayOfWeek: 1,
			startTime: '08:30',
			endTime: '09:30',
			maxQuota: 3
		});
		const other = await makeSchedule(doctor.id, { dayOfWeek: 2, startTime: '07:00', endTime: '08:00' });
		await makeBooking({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: b.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		});
		await makeBooking({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: b.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		});

		const slots = await getAllSlotsForDoctorDate([a, b, other], MONDAY);
		expect(slots).toEqual([
			{ time: '08:30', quota: 3, scheduleId: b.id },
			// a: quota 1, b: quota 3-2=1 -> a wins (seen first, not strictly greater)
			{ time: '09:00', quota: 1, scheduleId: a.id },
			{ time: '09:30', quota: 1, scheduleId: a.id }
		]);
	});

	it('counts bookings per schedule and time across several schedules', async () => {
		const { user, doctor, schedule: a } = await setup({
			dayOfWeek: 1,
			startTime: '09:00',
			endTime: '10:00',
			maxQuota: 2
		});
		const b = await makeSchedule(doctor.id, {
			dayOfWeek: 1,
			startTime: '09:30',
			endTime: '10:30',
			maxQuota: 3
		});
		const book = (scheduleId: string, appointmentTime: string, status?: 'cancelled' | 'confirmed') =>
			makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId, appointmentDate: MONDAY, appointmentTime, status });
		await book(a.id, '09:00');
		await book(a.id, '09:30', 'confirmed');
		await book(a.id, '09:30');
		await book(b.id, '09:30');
		await book(b.id, '10:00', 'cancelled'); // ignored
		await book(b.id, '10:00');
		// Another date on the same schedule must not count.
		await makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId: b.id, appointmentDate: '2030-01-14', appointmentTime: '10:00' });

		expect(await getAllSlotsForDoctorDate([a, b], MONDAY)).toEqual([
			{ time: '09:00', quota: 1, scheduleId: a.id },
			// a: 2-2=0, b: 3-1=2 -> b
			{ time: '09:30', quota: 2, scheduleId: b.id },
			{ time: '10:00', quota: 2, scheduleId: b.id }
		]);
	});

	it('skips schedules that are not in the database (unknown or malformed id)', async () => {
		const { schedule } = await setup({ dayOfWeek: 1, startTime: '09:00', endTime: '09:30', maxQuota: 2 });
		const ghost = { ...schedule, id: '00000000-0000-0000-0000-000000000000', startTime: '07:00' };
		const malformed = { ...schedule, id: 'not-a-uuid', startTime: '08:00' };
		expect(await getAllSlotsForDoctorDate([ghost, malformed, schedule], MONDAY)).toEqual([
			{ time: '09:00', quota: 2, scheduleId: schedule.id }
		]);
		expect(await getAllSlotsForDoctorDate([ghost, malformed], MONDAY)).toEqual([]);
	});

	it('prefers a later schedule when it has strictly more quota', async () => {
		const { doctor, schedule: a } = await setup({ dayOfWeek: 1, startTime: '09:00', endTime: '09:30', maxQuota: 1 });
		const b = await makeSchedule(doctor.id, { dayOfWeek: 1, startTime: '09:00', endTime: '09:30', maxQuota: 4 });
		expect(await getAllSlotsForDoctorDate([a, b], MONDAY)).toEqual([
			{ time: '09:00', quota: 4, scheduleId: b.id }
		]);
	});
});

describe('createBookingAtomic', () => {
	it('creates a pending booking when the slot has room', async () => {
		const { user, doctor, schedule } = await setup({ maxQuota: 1 });
		const res = await createBookingAtomic({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		});
		expect(res.ok).toBe(true);
		if (!res.ok) throw new Error('unreachable');
		const [row] = await db.select().from(bookings).where(eq(bookings.id, res.id));
		expect(row).toMatchObject({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00',
			status: 'pending'
		});
	});

	it('rejects an unknown schedule', async () => {
		const { user, doctor } = await setup();
		const res = await createBookingAtomic({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: '00000000-0000-0000-0000-000000000000',
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		});
		expect(res).toEqual({ ok: false, error: 'invalid_schedule' });
	});

	it('rejects a schedule that belongs to another doctor', async () => {
		const { user, schedule } = await setup();
		const otherDoctor = await makeDoctor();
		const res = await createBookingAtomic({
			userId: user.id,
			doctorId: otherDoctor.id,
			scheduleId: schedule.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		});
		expect(res).toEqual({ ok: false, error: 'invalid_schedule' });
	});

	it('rejects a date whose weekday does not match the schedule', async () => {
		const { user, doctor, schedule } = await setup({ dayOfWeek: 1 });
		const res = await createBookingAtomic({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: TUESDAY,
			appointmentTime: '09:00'
		});
		expect(res).toEqual({ ok: false, error: 'invalid_schedule' });
		expect(await db.select().from(bookings)).toHaveLength(0);
	});

	it('returns slot_full when quota is used, and cancelled bookings free the quota', async () => {
		const { user, doctor, schedule } = await setup({ maxQuota: 1 });
		const input = {
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00'
		};
		const first = await createBookingAtomic(input);
		expect(first.ok).toBe(true);
		expect(await createBookingAtomic(input)).toEqual({ ok: false, error: 'slot_full' });

		// Another slot on the same day is still free.
		expect((await createBookingAtomic({ ...input, appointmentTime: '09:30' })).ok).toBe(true);

		if (!first.ok) throw new Error('unreachable');
		expect(await cancelBookingForUser(user.id, first.id)).toEqual({ ok: true });
		expect((await createBookingAtomic(input)).ok).toBe(true);
	});

	it('lets exactly one of several concurrent requests win a quota-1 slot', async () => {
		const { doctor, schedule } = await setup({ maxQuota: 1 });
		const users = await Promise.all(Array.from({ length: 5 }, () => makeUser()));
		const results = await Promise.all(
			users.map((u) =>
				createBookingAtomic({
					userId: u.id,
					doctorId: doctor.id,
					scheduleId: schedule.id,
					appointmentDate: MONDAY,
					appointmentTime: '10:00'
				})
			)
		);
		expect(results.filter((r) => r.ok)).toHaveLength(1);
		expect(results.filter((r) => !r.ok)).toEqual(
			Array.from({ length: 4 }, () => ({ ok: false, error: 'slot_full' }))
		);
		expect(await db.select().from(bookings)).toHaveLength(1);
	});

	it('treats a missing count row as zero used', async () => {
		const { user, doctor, schedule } = await setup({ maxQuota: 1 });
		const realTransaction = db.transaction.bind(db);
		const spy = vi.spyOn(db, 'transaction').mockImplementation(((
			fn: (tx: unknown) => Promise<unknown>
		) =>
			realTransaction(async (tx) => {
				const wrapped = Object.create(tx) as typeof tx;
				let n = 0;
				wrapped.select = ((...args: Parameters<typeof tx.select>) => {
					n++;
					// 1st select = the FOR UPDATE schedule lock, 2nd = the used-quota count.
					if (n === 2) {
						// count query yields no row at all
						return { from: () => ({ where: async () => [] }) };
					}
					return tx.select(...args);
				}) as unknown as typeof tx.select;
				return fn(wrapped);
			})) as never);
		try {
			const res = await createBookingAtomic({
				userId: user.id,
				doctorId: doctor.id,
				scheduleId: schedule.id,
				appointmentDate: MONDAY,
				appointmentTime: '09:00'
			});
			expect(res.ok).toBe(true);
		} finally {
			spy.mockRestore();
		}
	});
});

describe('appointments', () => {
	async function seed() {
		const hospital = await makeHospital({ name: 'Emerald General' });
		const specialist = await makeSpecialist({ name: 'Cardiology' });
		const doctor = await makeDoctor({
			name: 'Dr. Heart',
			hospitalId: hospital.id,
			specialistId: specialist.id,
			imageUrl: 'http://img/x.png',
			rating: '4.9'
		});
		const schedule = await makeSchedule(doctor.id);
		const user = await makeUser();
		const other = await makeUser();
		const base = { doctorId: doctor.id, scheduleId: schedule.id };
		const b1 = await makeBooking({ ...base, userId: user.id, appointmentDate: '2030-01-07', appointmentTime: '09:00' });
		const b2 = await makeBooking({ ...base, userId: user.id, appointmentDate: '2030-01-14', appointmentTime: '09:00' });
		const b3 = await makeBooking({ ...base, userId: user.id, appointmentDate: '2030-01-14', appointmentTime: '10:30' });
		const foreign = await makeBooking({ ...base, userId: other.id });
		return { user, other, doctor, b1, b2, b3, foreign };
	}

	it('listAppointmentsForUser returns only the user rows, newest first, joined', async () => {
		const { user, doctor, b1, b2, b3 } = await seed();
		const rows = await listAppointmentsForUser(user.id);
		expect(rows.map((r) => r.id)).toEqual([b3.id, b2.id, b1.id]);
		expect(rows[0]).toMatchObject({
			doctorId: doctor.id,
			appointmentDate: '2030-01-14',
			appointmentTime: '10:30',
			status: 'pending',
			doctorName: 'Dr. Heart',
			doctorImage: 'http://img/x.png',
			doctorRating: '4.9',
			specialty: 'Cardiology',
			hospital: 'Emerald General'
		});
		expect(rows[0].createdAt).toBeInstanceOf(Date);
	});

	it('listAppointmentsForUser returns [] for a user without bookings', async () => {
		const u = await makeUser();
		expect(await listAppointmentsForUser(u.id)).toEqual([]);
	});

	it('getAppointmentForUser enforces ownership', async () => {
		const { user, b1, foreign } = await seed();
		expect((await getAppointmentForUser(user.id, b1.id))?.id).toBe(b1.id);
		expect(await getAppointmentForUser(user.id, foreign.id)).toBeNull();
	});
});

describe('cancelBookingForUser', () => {
	async function booking(status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
		const { user, doctor, schedule } = await setup();
		const b = await makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId: schedule.id, status });
		return { user, b };
	}
	const statusOf = async (id: string) =>
		(await db.select().from(bookings).where(eq(bookings.id, id)))[0].status;

	it('cancels pending and confirmed bookings', async () => {
		for (const s of ['pending', 'confirmed'] as const) {
			const { user, b } = await booking(s);
			expect(await cancelBookingForUser(user.id, b.id)).toEqual({ ok: true });
			expect(await statusOf(b.id)).toBe('cancelled');
		}
	});

	it('returns not_found for missing or foreign bookings', async () => {
		const { b } = await booking('pending');
		const stranger = await makeUser();
		expect(await cancelBookingForUser(stranger.id, b.id)).toEqual({ ok: false, error: 'not_found' });
		expect(await statusOf(b.id)).toBe('pending');
		expect(await cancelBookingForUser(stranger.id, '00000000-0000-0000-0000-000000000000')).toEqual({
			ok: false,
			error: 'not_found'
		});
	});

	it('refuses already cancelled or completed bookings', async () => {
		const c = await booking('cancelled');
		expect(await cancelBookingForUser(c.user.id, c.b.id)).toEqual({ ok: false, error: 'already_cancelled' });
		const d = await booking('completed');
		expect(await cancelBookingForUser(d.user.id, d.b.id)).toEqual({ ok: false, error: 'already_completed' });
		expect(await statusOf(d.b.id)).toBe('completed');
	});
});

describe('non-UUID id guards', () => {
	it('getSlotAvailability returns an empty map', async () => {
		expect((await getSlotAvailability('not-a-uuid', MONDAY)).size).toBe(0);
	});

	it.each([
		['scheduleId', { scheduleId: 'not-a-uuid' }],
		['doctorId', { doctorId: 'not-a-uuid' }]
	])('createBookingAtomic rejects a non-UUID %s without inserting', async (_c, patch) => {
		const { user, doctor, schedule } = await setup();
		const res = await createBookingAtomic({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: MONDAY,
			appointmentTime: '09:00',
			...patch
		});
		expect(res).toEqual({ ok: false, error: 'invalid_schedule' });
		expect(await db.select().from(bookings)).toHaveLength(0);
	});

	it('getAppointmentForUser returns null', async () => {
		const u = await makeUser();
		expect(await getAppointmentForUser(u.id, 'not-a-uuid')).toBeNull();
	});

	it('cancelBookingForUser returns not_found', async () => {
		const u = await makeUser();
		expect(await cancelBookingForUser(u.id, 'not-a-uuid')).toEqual({ ok: false, error: 'not_found' });
	});
});
