import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeBooking, makeDoctor, makeSchedule, makeSession, makeUser } from '../../../test/factories.ts';
import { ev, thrown } from '../../../test/helpers-routes-public.ts';
import { toPublicUser } from '#lib/server/auth/session.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

type Data = { profile: unknown; memberSince: string; stats: { bloodType: string; nextVisit: string; reports: number } };

describe('profile load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({ status: 303, location: '/login?redirect=/profile' });
	});

	it('shows placeholders when there is no history', async () => {
		const user = await makeUser();
		const data = (await load(ev({ user }))) as Data;
		expect(data.profile).not.toHaveProperty('passwordHash');
		expect(data.profile).not.toHaveProperty('googleId');
		expect(data.profile).toEqual(toPublicUser(user));
		expect(data.memberSince).toBeTruthy();
		expect(data.stats).toEqual({ bloodType: '—', nextVisit: '—', reports: 0 });
	});

	it('computes next visit and completed reports', async () => {
		const user = await makeUser({ bloodType: 'O+' });
		const doctor = await makeDoctor();
		const schedule = await makeSchedule(doctor.id);
		const base = { userId: user.id, doctorId: doctor.id, scheduleId: schedule.id };
		await makeBooking({ ...base, appointmentDate: '2031-01-06', status: 'confirmed' });
		await makeBooking({ ...base, appointmentDate: '2030-01-07', status: 'pending' });
		await makeBooking({ ...base, appointmentDate: '2029-01-01', status: 'cancelled' });
		await makeBooking({ ...base, appointmentDate: '2020-01-06', status: 'completed' });
		await makeBooking({ ...base, appointmentDate: '2020-01-13', status: 'completed' });

		const data = (await load(ev({ user }))) as Data;
		expect(data.stats.bloodType).toBe('O+');
		expect(data.stats.reports).toBe(2);
		expect(data.stats.nextVisit).not.toBe('—');
		expect(data.stats.nextVisit).toMatch(/Jan/);
	});
});

describe('profile load: local "today"', () => {
	afterEach(() => vi.useRealTimers());

	it('treats a booking on the local calendar day as the next visit, even late in the evening', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date(2030, 0, 5, 23, 30, 0));
		const user = await makeUser();
		const doctor = await makeDoctor();
		const schedule = await makeSchedule(doctor.id);
		const base = { userId: user.id, doctorId: doctor.id, scheduleId: schedule.id };
		await makeBooking({ ...base, appointmentDate: '2030-01-04', status: 'pending' });
		await makeBooking({ ...base, appointmentDate: '2030-01-05', status: 'pending' });

		const data = (await load(ev({ user }))) as Data;
		expect(data.stats.nextVisit).toBe('Jan 5');
	});
});

describe('profile logout action', () => {
	it('deletes the session and clears the cookie', async () => {
		const user = await makeUser();
		const sid = await makeSession(user.id);
		const e = ev({ user, cookies: { session_id: sid } });
		expect(await thrown(() => actions.logout(e))).toMatchObject({ status: 303, location: '/login' });
		expect(e.jar.get('session_id')).toBe('');
		expect(await db.select().from(sessions).where(eq(sessions.id, sid))).toHaveLength(0);
	});

	it('still clears the cookie without a session', async () => {
		const e = ev();
		expect(await thrown(() => actions.logout(e))).toMatchObject({ location: '/login' });
		expect(e.jar.get('session_id')).toBe('');
	});
});
