import { beforeEach, describe, expect, it } from 'vitest';
import { toPublicUser } from '#lib/server/auth/session.ts';
import { makeBooking, makeDoctor, makeSchedule, makeUser } from '#test/factories.ts';
import { ev, randomId, thrown, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

type Slot = { time: string; label: string; quota: number; scheduleId: string; period: string; isFull: boolean };
type Data = {
	user: unknown;
	doctor: { role: string };
	calendarDays: { date: string }[];
	selectedDate: string;
	slots: Slot[];
	availableDays: number[];
	monthLabel: string;
};

describe('book page load', () => {
	it('404s for unknown doctors', async () => {
		expect(await thrown(() => load(ev({ params: { id: randomId() } })))).toMatchObject({ status: 404 });
	});

	it('returns no date/slots when the doctor has no schedule', async () => {
		const doctor = await makeDoctor();
		const data = (await load(ev({ params: { id: doctor.id } }))) as Data;
		expect(data.selectedDate).toBe('');
		expect(data.slots).toEqual([]);
		expect(data.monthLabel).toBe('');
		expect(data.calendarDays).toHaveLength(14);
	});

	it('builds morning/afternoon slots with quotas and marks full slots', async () => {
		const user = await makeUser();
		const doctor = await makeDoctor();
		// A schedule on every weekday, so the default date always has slots (timezone-proof).
		for (let day = 0; day < 7; day++) {
			await makeSchedule(doctor.id, { dayOfWeek: day, startTime: '11:30', endTime: '12:30', maxQuota: 1 });
		}

		const first = (await load(ev({ params: { id: doctor.id }, user }))) as Data;
		expect(first.user).toEqual(toPublicUser(user));
		expect(first.selectedDate).toBe(first.calendarDays[0].date);
		expect(first.monthLabel).toMatch(/\d{4}$/);
		expect(first.availableDays).toHaveLength(7);
		expect(first.doctor.role).toBeTruthy();
		expect(first.slots.map((s) => [s.time, s.period, s.isFull])).toEqual([
			['11:30', 'morning', false],
			['12:00', 'afternoon', false]
		]);
		expect(first.slots[0].label).toBe('11:30 AM');

		// Request a specific later date and fill its morning slot.
		const date = first.calendarDays[3].date;
		const slot = first.slots[0];
		await makeBooking({
			userId: user.id,
			doctorId: doctor.id,
			scheduleId: (await load(ev({ params: { id: doctor.id }, url: `/?date=${date}` })) as Data).slots[0]
				.scheduleId,
			appointmentDate: date,
			appointmentTime: slot.time
		});

		const later = (await load(ev({ params: { id: doctor.id }, url: `/?date=${date}` }))) as Data;
		expect(later.selectedDate).toBe(date);
		expect(later.slots[0]).toMatchObject({ time: '11:30', quota: 0, isFull: true });
		expect(later.slots[1].isFull).toBe(false);
	});
});
