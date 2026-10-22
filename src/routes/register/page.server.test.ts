import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions, users } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeUser } from '../../test/factories.ts';
import { ev, thrown } from '../../test/helpers-routes-public.ts';
import { setEnv } from '../../test/mocks/env-private.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('register load', () => {
	it('redirects signed-in users and reports Google availability', async () => {
		expect(await thrown(() => load(ev({ user: { id: 'x' } as never })))).toMatchObject({
			location: '/home'
		});
		expect(await load(ev())).toEqual({ googleEnabled: false });
		setEnv({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's' });
		expect(await load(ev())).toEqual({ googleEnabled: true });
	});
});

describe('register action', () => {
	it('validates required fields', async () => {
		for (const form of [
			{ other: '1' },
			{ name: 'A', email: 'a@x.com', password: 'short' },
			{ name: ' ', email: 'a@x.com', password: 'longenough' },
			{ name: 'A', email: '', password: 'longenough' }
		] as Record<string, string>[]) {
			expect(await actions.default(ev({ form }))).toMatchObject({ status: 400 });
		}
	});

	it('rejects duplicate emails', async () => {
		await makeUser({ email: 'dup@x.com' });
		expect(
			await actions.default(ev({ form: { name: 'A', email: 'DUP@x.com', password: 'longenough' } }))
		).toMatchObject({ status: 400, data: { error: 'Email already registered.' } });
	});

	it('creates a patient, signs them in and redirects home', async () => {
		const e = ev({
			form: { name: ' Ana ', email: 'Ana@X.com', phone: ' 0812 ', password: 'longenough' }
		});
		expect(await thrown(() => actions.default(e))).toMatchObject({ status: 303, location: '/home' });
		const [u] = await db.select().from(users).where(eq(users.email, 'ana@x.com'));
		expect(u).toMatchObject({ name: 'Ana', phone: '0812', role: 'patient' });
		expect(u.passwordHash).toMatch(/^\$argon2/);
		const [s] = await db.select().from(sessions).where(eq(sessions.id, e.jar.get('session_id')));
		expect(s.userId).toBe(u.id);

		await thrown(() =>
			actions.default(ev({ form: { name: 'B', email: 'b@x.com', password: 'longenough' } }))
		);
		const [b] = await db.select().from(users).where(eq(users.email, 'b@x.com'));
		expect(b.phone).toBeNull();
	});
});
