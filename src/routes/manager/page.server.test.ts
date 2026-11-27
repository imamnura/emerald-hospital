import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	makeBooking,
	makeDoctor,
	makeHospital,
	makeSchedule,
	makeSpecialist,
	makeUser
} from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

type Event = Parameters<typeof load>[0];
type Data = Awaited<ReturnType<typeof load>> & Record<string, unknown>;

const run = async (url: string) => (await load(ev<Event>({ url }))) as Data;

beforeEach(async () => {
	await reset();
	vi.useFakeTimers({ toFake: ['Date'] });
	// "today" = 2030-06-15. 30d window: 2030-05-17..2030-06-15, previous: 2030-04-17..2030-05-16.
	vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
});

async function seed() {
	const patient = await makeUser({ name: 'Pat' });
	const hA = await makeHospital({ name: 'A Hospital' });
	const hB = await makeHospital({ name: 'B Hospital' });
	const cardio = await makeSpecialist({ name: 'Cardiology' });
	const derm = await makeSpecialist({ name: 'Dermatology' });
	const docA = await makeDoctor({ name: 'Dr A', hospitalId: hA.id, specialistId: cardio.id });
	const docB = await makeDoctor({ name: 'Dr B', hospitalId: hB.id, specialistId: derm.id });
	const sA = await makeSchedule(docA.id);
	const sB = await makeSchedule(docB.id);
	const book = (doctorId: string, scheduleId: string, appointmentDate: string, status: 'pending' | 'confirmed') =>
		makeBooking({ userId: patient.id, doctorId, scheduleId, appointmentDate, status });

	// current window
	await book(docA.id, sA.id, '2030-06-10', 'pending');
	await book(docA.id, sA.id, '2030-06-14', 'pending');
	await book(docB.id, sB.id, '2030-06-15', 'confirmed');
	// previous window
	await book(docA.id, sA.id, '2030-05-01', 'pending');
	// future (excluded from every window)
	await book(docA.id, sA.id, '2030-07-01', 'pending');
	return { hA, hB, cardio, derm, docA, docB };
}

describe('manager dashboard load', () => {
	it('defaults to 30d and computes trend percentages against the previous period', async () => {
		await seed();
		const data = await run('/manager');

		expect(data.filters).toEqual({ range: '30d', hospitalId: null, specialistId: null });
		expect(data.rangeLabel).toBe('Last 30 days');
		expect(data.totals).toEqual({ hospitals: 2, doctors: 2, bookings: 3, pending: 2 });
		// (3 - 1) / 1 = 200%, (2 - 1) / 1 = 100%
		expect(data.trend).toEqual({ bookings: 200, pending: 100 });
		expect(data.filterOptions.hospitals.map((h: { name: string }) => h.name)).toEqual(['A Hospital', 'B Hospital']);
		expect(data.filterOptions.specialists.map((s: { name: string }) => s.name)).toEqual(['Cardiology', 'Dermatology']);
		expect(Object.keys(data.filterOptions.hospitals[0])).toEqual(['id', 'name']);
		expect(data.series).toHaveLength(30);
		expect(data.series.at(-1)).toEqual({ date: '2030-06-15', total: 1 });
		expect(data.status).toEqual([
			{ status: 'pending', count: 2 },
			{ status: 'confirmed', count: 1 },
			{ status: 'completed', count: 0 },
			{ status: 'cancelled', count: 0 }
		]);
		expect(data.bySpecialty).toEqual([
			{ specialty: 'Cardiology', total: 2 },
			{ specialty: 'Dermatology', total: 1 }
		]);
		expect(data.topDoctors[0]).toMatchObject({ name: 'Dr A', total: 2 });
		expect(data.recent).toHaveLength(3);
	});

	it('returns null trends for the all-time range', async () => {
		await seed();
		const data = await run('/manager?range=all');
		expect(data.rangeLabel).toBe('All time');
		expect(data.totals.bookings).toBe(4); // everything up to today
		expect(data.trend).toEqual({ bookings: null, pending: null });
	});

	it('reports 100% when the previous period was empty and 0% when both are empty', async () => {
		const { hB } = await seed();
		// Only hospital B: 1 confirmed now, nothing before.
		const data = await run(`/manager?range=7d&hospitalId=${hB.id}`);
		expect(data.rangeLabel).toBe('Last 7 days');
		expect(data.totals).toMatchObject({ bookings: 1, pending: 0 });
		expect(data.trend).toEqual({ bookings: 100, pending: 0 });
	});

	it('applies hospital and specialty filters together', async () => {
		const { hA, cardio, derm } = await seed();
		const match = await run(`/manager?range=90d&hospitalId=${hA.id}&specialistId=${cardio.id}`);
		expect(match.filters).toEqual({ range: '90d', hospitalId: hA.id, specialistId: cardio.id });
		expect(match.totals).toMatchObject({ bookings: 3, pending: 3 });
		expect(match.bySpecialty).toEqual([{ specialty: 'Cardiology', total: 3 }]);

		const none = await run(`/manager?range=365d&hospitalId=${hA.id}&specialistId=${derm.id}`);
		expect(none.rangeLabel).toBe('Last 12 months');
		expect(none.totals).toMatchObject({ bookings: 0, pending: 0 });
		expect(none.trend).toEqual({ bookings: 0, pending: 0 });
		expect(none.recent).toEqual([]);
	});

	it('ignores non-UUID hospital and specialty filters instead of throwing', async () => {
		await seed();
		const data = await run('/manager?hospitalId=abc&specialistId=xyz');
		expect(data.filters).toEqual({ range: '30d', hospitalId: null, specialistId: null });
		expect(data.totals).toMatchObject({ bookings: 3, pending: 2 });
	});

	it('falls back to 30d for an unknown range and works on an empty database', async () => {
		const data = await run('/manager?range=bogus');
		expect(data.filters.range).toBe('30d');
		expect(data.totals).toEqual({ hospitals: 0, doctors: 0, bookings: 0, pending: 0 });
		expect(data.trend).toEqual({ bookings: 0, pending: 0 });
		expect(data.filterOptions).toEqual({ hospitals: [], specialists: [] });
	});

	it('computes negative trends when bookings dropped', async () => {
		const patient = await makeUser();
		const doc = await makeDoctor();
		const s = await makeSchedule(doc.id);
		for (const d of ['2030-05-01', '2030-05-02', '2030-05-03', '2030-05-04']) {
			await makeBooking({ userId: patient.id, doctorId: doc.id, scheduleId: s.id, appointmentDate: d });
		}
		await makeBooking({ userId: patient.id, doctorId: doc.id, scheduleId: s.id, appointmentDate: '2030-06-01' });
		const data = await run('/manager');
		expect(data.trend).toEqual({ bookings: -75, pending: -75 });
	});
});
