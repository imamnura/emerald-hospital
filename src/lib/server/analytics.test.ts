import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
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
	bookingsBySpecialty,
	bookingsOverTime,
	exportRows,
	parseFilters,
	previousTotals,
	rangeLabel,
	recentBookings,
	statusBreakdown,
	topDoctors,
	totals,
	type AnalyticsFilters,
	type DateRangePreset
} from './analytics.ts';

const NOW = new Date('2026-06-15T10:00:00Z');

const f = (range: DateRangePreset, o: Partial<AnalyticsFilters> = {}): AnalyticsFilters => ({
	range,
	hospitalId: null,
	specialistId: null,
	...o
});

beforeAll(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(NOW);
});
afterAll(() => {
	vi.useRealTimers();
});

beforeEach(() => resetDb(db as unknown as TestDb));

async function seed() {
	const h1 = await makeHospital({ name: 'North Hospital' });
	const h2 = await makeHospital({ name: 'South Hospital' });
	const s1 = await makeSpecialist({ name: 'Cardiology' });
	const s2 = await makeSpecialist({ name: 'Neurology' });
	const dA = await makeDoctor({ name: 'Dr. A', hospitalId: h1.id, specialistId: s1.id });
	const dB = await makeDoctor({ name: 'Dr. B', hospitalId: h2.id, specialistId: s2.id });
	const schA = await makeSchedule(dA.id);
	const schB = await makeSchedule(dB.id);
	const patient = await makeUser({ name: 'Pat' });

	const book = (
		doc: 'A' | 'B',
		appointmentDate: string,
		status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
		appointmentTime = '09:00'
	) =>
		makeBooking({
			userId: patient.id,
			doctorId: doc === 'A' ? dA.id : dB.id,
			scheduleId: doc === 'A' ? schA.id : schB.id,
			appointmentDate,
			appointmentTime,
			status
		});

	await book('A', '2026-06-15', 'pending');
	await book('A', '2026-06-14', 'confirmed');
	await book('B', '2026-06-10', 'completed');
	await book('B', '2026-06-05', 'pending'); // previous 7d window
	await book('A', '2026-06-01', 'cancelled');
	await book('A', '2026-04-01', 'confirmed');
	await book('B', '2025-08-01', 'completed');
	await book('A', '2024-01-01', 'pending');
	await book('A', '2026-06-20', 'pending'); // future — never counted

	return { h1, h2, s1, s2, dA, dB, patient };
}

describe('parseFilters', () => {
	it('defaults to 30d with null ids', () => {
		expect(parseFilters(new URLSearchParams())).toEqual({
			range: '30d',
			hospitalId: null,
			specialistId: null
		});
	});

	it('accepts every preset and falls back on unknown values', () => {
		for (const r of ['7d', '30d', '90d', '365d', 'all']) {
			expect(parseFilters(new URLSearchParams({ range: r })).range).toBe(r);
		}
		expect(parseFilters(new URLSearchParams({ range: 'bogus' })).range).toBe('30d');
	});

	it('reads hospital and specialist ids, treating empty as null', () => {
		expect(parseFilters(new URLSearchParams('hospitalId=h&specialistId=s'))).toMatchObject({
			hospitalId: 'h',
			specialistId: 's'
		});
		expect(parseFilters(new URLSearchParams('hospitalId=&specialistId='))).toMatchObject({
			hospitalId: null,
			specialistId: null
		});
	});
});

describe('rangeLabel', () => {
	it('labels every preset', () => {
		expect(rangeLabel('7d')).toBe('Last 7 days');
		expect(rangeLabel('30d')).toBe('Last 30 days');
		expect(rangeLabel('90d')).toBe('Last 90 days');
		expect(rangeLabel('365d')).toBe('Last 12 months');
		expect(rangeLabel('all')).toBe('All time');
	});
});

describe('totals', () => {
	it('counts bookings per range preset, excluding future dates', async () => {
		await seed();
		expect(await totals(f('7d'))).toEqual({ hospitals: 2, doctors: 2, bookings: 3, pending: 1 });
		expect(await totals(f('30d'))).toMatchObject({ bookings: 5, pending: 2 });
		expect(await totals(f('90d'))).toMatchObject({ bookings: 6, pending: 2 });
		expect(await totals(f('365d'))).toMatchObject({ bookings: 7, pending: 2 });
		expect(await totals(f('all'))).toMatchObject({ bookings: 8, pending: 3 });
	});

	it('filters by hospital and specialist', async () => {
		const { h1, s2 } = await seed();
		expect(await totals(f('all', { hospitalId: h1.id }))).toMatchObject({ bookings: 5, pending: 2 });
		expect(await totals(f('all', { specialistId: s2.id }))).toMatchObject({ bookings: 3, pending: 1 });
		expect(await totals(f('all', { hospitalId: h1.id, specialistId: s2.id }))).toMatchObject({
			bookings: 0,
			pending: 0
		});
	});

	it('returns zeros on an empty database', async () => {
		expect(await totals(f('30d'))).toEqual({ hospitals: 0, doctors: 0, bookings: 0, pending: 0 });
	});
});

describe('previousTotals', () => {
	it('returns zeros for all-time', async () => {
		await seed();
		expect(await previousTotals(f('all'))).toEqual({ bookings: 0, pending: 0 });
	});

	it('counts the immediately preceding window of the same length', async () => {
		const { h1, s2 } = await seed();
		// 7d current = 06-09..06-15, previous = 06-02..06-08 → only 06-05 (pending)
		expect(await previousTotals(f('7d'))).toEqual({ bookings: 1, pending: 1 });
		expect(await previousTotals(f('7d', { hospitalId: h1.id }))).toEqual({ bookings: 0, pending: 0 });
		expect(await previousTotals(f('7d', { specialistId: s2.id }))).toEqual({ bookings: 1, pending: 1 });
		// 30d previous = 04-17..05-16 → nothing
		expect(await previousTotals(f('30d'))).toEqual({ bookings: 0, pending: 0 });
		// 90d previous = 2025-12-18..2026-03-17 → nothing
		expect(await previousTotals(f('90d'))).toEqual({ bookings: 0, pending: 0 });
		// 365d previous = 2024-06-16..2025-06-15 → nothing
		expect(await previousTotals(f('365d'))).toEqual({ bookings: 0, pending: 0 });
	});

	it('covers a preceding 30d booking', async () => {
		const { patient, dA } = await seed();
		const sch = await makeSchedule(dA.id);
		await makeBooking({
			userId: patient.id,
			doctorId: dA.id,
			scheduleId: sch.id,
			appointmentDate: '2026-05-16',
			status: 'confirmed'
		});
		expect(await previousTotals(f('30d'))).toEqual({ bookings: 1, pending: 0 });
	});
});

describe('bookingsOverTime', () => {
	it('fills every day of the 7d window with zeros where missing', async () => {
		await seed();
		const series = await bookingsOverTime(f('7d'));
		expect(series).toEqual([
			{ date: '2026-06-09', total: 0 },
			{ date: '2026-06-10', total: 1 },
			{ date: '2026-06-11', total: 0 },
			{ date: '2026-06-12', total: 0 },
			{ date: '2026-06-13', total: 0 },
			{ date: '2026-06-14', total: 1 },
			{ date: '2026-06-15', total: 1 }
		]);
	});

	it('spans 30 days for 30d', async () => {
		await seed();
		const series = await bookingsOverTime(f('30d'));
		expect(series).toHaveLength(30);
		expect(series[0].date).toBe('2026-05-17');
		expect(series.at(-1)?.date).toBe('2026-06-15');
		expect(series.reduce((a, p) => a + p.total, 0)).toBe(5);
	});

	it('starts all-time at the earliest booking', async () => {
		await seed();
		const series = await bookingsOverTime(f('all'));
		expect(series[0]).toEqual({ date: '2024-01-01', total: 1 });
		expect(series.at(-1)?.date).toBe('2026-06-15');
		expect(series.reduce((a, p) => a + p.total, 0)).toBe(8);
	});

	it('returns just today for all-time with no bookings', async () => {
		expect(await bookingsOverTime(f('all'))).toEqual([{ date: '2026-06-15', total: 0 }]);
	});

	it('respects hospital filter', async () => {
		const { h2 } = await seed();
		const series = await bookingsOverTime(f('7d', { hospitalId: h2.id }));
		expect(series.filter((p) => p.total > 0).map((p) => p.date)).toEqual(['2026-06-10']);
	});
});

describe('statusBreakdown', () => {
	it('returns all four statuses in fixed order', async () => {
		await seed();
		expect(await statusBreakdown(f('all'))).toEqual([
			{ status: 'pending', count: 3 },
			{ status: 'confirmed', count: 2 },
			{ status: 'completed', count: 2 },
			{ status: 'cancelled', count: 1 }
		]);
		expect(await statusBreakdown(f('7d'))).toEqual([
			{ status: 'pending', count: 1 },
			{ status: 'confirmed', count: 1 },
			{ status: 'completed', count: 1 },
			{ status: 'cancelled', count: 0 }
		]);
	});
});

describe('bookingsBySpecialty', () => {
	it('groups and orders by count', async () => {
		const { h2 } = await seed();
		expect(await bookingsBySpecialty(f('all'))).toEqual([
			{ specialty: 'Cardiology', total: 5 },
			{ specialty: 'Neurology', total: 3 }
		]);
		expect(await bookingsBySpecialty(f('all', { hospitalId: h2.id }))).toEqual([
			{ specialty: 'Neurology', total: 3 }
		]);
	});
});

describe('topDoctors', () => {
	it('ranks doctors and applies limit', async () => {
		const { dA, dB, s2 } = await seed();
		expect(await topDoctors(f('all'))).toEqual([
			{ id: dA.id, name: 'Dr. A', specialty: 'Cardiology', total: 5 },
			{ id: dB.id, name: 'Dr. B', specialty: 'Neurology', total: 3 }
		]);
		expect(await topDoctors(f('all'), 1)).toHaveLength(1);
		expect(await topDoctors(f('all', { specialistId: s2.id }))).toEqual([
			{ id: dB.id, name: 'Dr. B', specialty: 'Neurology', total: 3 }
		]);
	});
});

describe('recentBookings', () => {
	it('returns joined rows within the range, limited', async () => {
		await seed();
		const rows = await recentBookings(f('7d'));
		expect(rows).toHaveLength(3);
		expect(rows[0]).toMatchObject({
			patient: 'Pat',
			hospital: expect.stringMatching(/Hospital/),
			time: '09:00'
		});
		expect(new Set(rows.map((r) => r.date))).toEqual(
			new Set(['2026-06-15', '2026-06-14', '2026-06-10'])
		);
		expect(await recentBookings(f('all'), 2)).toHaveLength(2);
		expect(await recentBookings(f('all'))).toHaveLength(8);
	});
});

describe('exportRows', () => {
	it('returns every matching booking ordered by date desc', async () => {
		const { h1 } = await seed();
		const rows = await exportRows(f('7d'));
		expect(rows.map((r) => r.date)).toEqual(['2026-06-15', '2026-06-14', '2026-06-10']);
		expect(rows[0]).toEqual({
			id: expect.any(String),
			patient: 'Pat',
			doctor: 'Dr. A',
			specialty: 'Cardiology',
			hospital: 'North Hospital',
			date: '2026-06-15',
			time: '09:00',
			status: 'pending'
		});
		expect(await exportRows(f('all', { hospitalId: h1.id }))).toHaveLength(5);
	});
});

describe('degenerate query paths', () => {
	it('falls back to zero when count queries return no row', async () => {
		const chain: Record<string, unknown> = new Proxy(
			{},
			{
				get: (_t, prop) =>
					prop === 'then'
						? (resolve: (v: unknown[]) => void) => resolve([])
						: () => chain
			}
		);
		const spy = vi.spyOn(db, 'select').mockImplementation((() => chain) as never);
		try {
			expect(await totals(f('7d'))).toEqual({ hospitals: 0, doctors: 0, bookings: 0, pending: 0 });
			expect(await previousTotals(f('7d'))).toEqual({ bookings: 0, pending: 0 });
		} finally {
			spy.mockRestore();
		}
	});
});
