import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { hashPassword } from '#lib/server/auth/password.ts';
import { db } from '#lib/server/db/index.ts';
import { sessions } from '#lib/server/db/schema.ts';
import { makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { setEnv } from '#test/mocks/env-private.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

const patient = { id: 'p', role: 'patient' } as never;
const manager = { id: 'm', role: 'manager' } as never;

describe('login load', () => {
	it.each([
		['/login?redirect=/appointments', patient, '/appointments'],
		['/login', patient, '/home'],
		['/login', manager, '/manager'],
		['/login?redirect=//evil.com', patient, '/home'],
		['/login?redirect=/login/forgot', manager, '/manager'],
		['/login?redirect=https://evil.com', patient, '/home']
	])('signed-in user at %s is redirected safely', async (url, user, location) => {
		expect(await thrown(() => load(ev({ url, user })))).toMatchObject({ status: 303, location });
	});

	it('returns page data for anonymous visitors', async () => {
		expect(await load(ev({ url: '/login?redirect=/x&error=Oops&reset=success' }))).toEqual({
			redirectTo: '/x',
			errorMsg: 'Oops',
			resetSuccess: true,
			googleEnabled: false
		});
		setEnv({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' });
		expect(await load(ev({ url: '/login' }))).toMatchObject({
			redirectTo: null,
			errorMsg: null,
			resetSuccess: false,
			googleEnabled: true
		});
	});
});

describe('login action', () => {
	const login = (form: Record<string, string>) => {
		const e = ev({ form });
		return { e, run: () => actions.default(e) };
	};

	it('requires email and password', async () => {
		expect(await login({ email: ' ', password: 'x' }).run()).toMatchObject({ status: 400 });
		expect(await login({ email: 'a@b.c' }).run()).toMatchObject({
			status: 400,
			data: { error: 'Email and password are required.' }
		});
		expect(await actions.default(ev({ form: { other: '1' } }))).toMatchObject({ status: 400 });
	});

	it('rejects unknown email, Google-only accounts and wrong passwords', async () => {
		expect(await login({ email: 'nobody@x.com', password: 'secret123' }).run()).toMatchObject({
			status: 400,
			data: { error: 'Invalid email or password.' }
		});

		await makeUser({ email: 'g@x.com', passwordHash: null });
		const google = (await login({ email: 'g@x.com', password: 'secret123' }).run()) as {
			data: { error: string };
		};
		expect(google.data.error).toMatch(/Google sign-in/);

		await makeUser({ email: 'p@x.com', passwordHash: await hashPassword('secret123') });
		expect(await login({ email: 'p@x.com', password: 'wrong-pass' }).run()).toMatchObject({
			status: 400,
			data: { error: 'Invalid email or password.' }
		});
	});

	it('creates a session, sets the cookie and honours a safe redirect', async () => {
		const user = await makeUser({ email: 'p@x.com', passwordHash: await hashPassword('secret123') });
		const { e, run } = login({ email: ' P@X.com ', password: 'secret123', redirect: '/doctors/1' });
		expect(await thrown(run)).toMatchObject({ status: 303, location: '/doctors/1' });

		const sid = e.jar.get('session_id');
		expect(sid).toBeTruthy();
		const [row] = await db.select().from(sessions).where(eq(sessions.id, sid));
		expect(row.userId).toBe(user.id);
	});

	it('falls back to the role home for missing or unsafe redirects', async () => {
		await makeUser({ email: 'p@x.com', passwordHash: await hashPassword('secret123') });
		await makeUser({ email: 'm@x.com', role: 'manager', passwordHash: await hashPassword('secret123') });

		expect(await thrown(login({ email: 'p@x.com', password: 'secret123' }).run)).toMatchObject({
			location: '/home'
		});
		expect(
			await thrown(login({ email: 'm@x.com', password: 'secret123', redirect: '//evil.com' }).run)
		).toMatchObject({ location: '/manager' });
	});
});
