import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	makeBooking,
	makeDoctor,
	makeHospital,
	makeManager,
	makeSchedule,
	makeSpecialist,
	makeUser
} from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { GET } from './+server.ts';

type Event = Parameters<typeof GET>[0];

const BOM = '﻿';

beforeEach(async () => {
	await reset();
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
});

describe('GET /manager/export.csv', () => {
	it('rejects anonymous users and patients with 403', async () => {
		const patient = await makeUser();
		for (const user of [null, patient]) {
			await expect(GET(ev<Event>({ url: '/manager/export.csv', user }))).rejects.toMatchObject({
				status: 403,
				body: { message: 'Manager access required' }
			});
		}
	});

	it('returns a BOM-prefixed CSV with headers, filename and escaped cells', async () => {
		const manager = await makeManager();
		const patient = await makeUser({ name: 'Doe, "Johnny"\nJr.' });
		const hospital = await makeHospital({ name: 'Carriage\rReturn Hospital' });
		const specialist = await makeSpecialist({ name: 'Cardiology' });
		const doctor = await makeDoctor({ name: 'Dr Plain', hospitalId: hospital.id, specialistId: specialist.id });
		const schedule = await makeSchedule(doctor.id);
		const b1 = await makeBooking({
			userId: patient.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: '2030-06-14',
			appointmentTime: '10:00',
			status: 'completed'
		});
		const b2 = await makeBooking({
			userId: manager.id,
			doctorId: doctor.id,
			scheduleId: schedule.id,
			appointmentDate: '2030-06-10',
			appointmentTime: '09:00',
			status: 'cancelled'
		});
		// outside the 7d window
		await makeBooking({ userId: manager.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentDate: '2030-01-01' });

		const res = await GET(ev<Event>({ url: '/manager/export.csv?range=7d', user: manager }));

		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
		expect(res.headers.get('Content-Disposition')).toBe(
			'attachment; filename="emerald-bookings-7d-2030-06-15.csv"'
		);
		expect(res.headers.get('Cache-Control')).toBe('no-store');

		const buf = new Uint8Array(await res.clone().arrayBuffer());
		expect([...buf.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

		const text = await res.text();
		// Response.text() strips a leading BOM per the WHATWG decode algorithm; check the raw bytes above.
		const body = text.startsWith(BOM) ? text.slice(1) : text;
		const expected = [
			'# Emerald Hospital bookings — Last 7 days',
			'# Generated 2030-06-15T12:00:00.000Z',
			'Booking ID,Patient,Doctor,Specialty,Hospital,Appointment Date,Appointment Time,Status',
			`${b1.id},"Doe, ""Johnny""\nJr.",Dr Plain,Cardiology,"Carriage\rReturn Hospital",2030-06-14,10:00,Completed`,
			`${b2.id},${manager.name},Dr Plain,Cardiology,"Carriage\rReturn Hospital",2030-06-10,09:00,Cancelled`
		].join('\n');
		expect(body).toBe(expected);
	});

	it('labels pending/confirmed statuses and defaults to the 30d range', async () => {
		const manager = await makeManager();
		const doctor = await makeDoctor();
		const schedule = await makeSchedule(doctor.id);
		await makeBooking({ userId: manager.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentDate: '2030-06-01', appointmentTime: '08:00', status: 'pending' });
		await makeBooking({ userId: manager.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentDate: '2030-06-02', status: 'confirmed' });

		const res = await GET(ev<Event>({ url: '/manager/export.csv?range=nope', user: manager }));
		expect(res.headers.get('Content-Disposition')).toContain('emerald-bookings-30d-2030-06-15.csv');
		const lines = (await res.text()).replace(/^﻿/, '').split('\n');
		expect(lines[0]).toBe('# Emerald Hospital bookings — Last 30 days');
		expect(lines.slice(3).map((l) => l.split(',').at(-1))).toEqual(['Confirmed', 'Pending']);
	});

	it('honours hospital/specialty filters and emits only the header when nothing matches', async () => {
		const manager = await makeManager();
		const doctor = await makeDoctor();
		const schedule = await makeSchedule(doctor.id);
		await makeBooking({ userId: manager.id, doctorId: doctor.id, scheduleId: schedule.id, appointmentDate: '2030-06-01' });
		const other = await makeHospital();

		const res = await GET(
			ev<Event>({ url: `/manager/export.csv?range=all&hospitalId=${other.id}`, user: manager })
		);
		expect(res.headers.get('Content-Disposition')).toContain('emerald-bookings-all-2030-06-15.csv');
		const lines = (await res.text()).replace(/^﻿/, '').split('\n');
		expect(lines).toHaveLength(3);
		expect(lines[0]).toContain('All time');
	});
});
