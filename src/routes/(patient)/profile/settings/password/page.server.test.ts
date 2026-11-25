import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../../../../test/db.ts';
import { makeUser } from '../../../../../test/factories.ts';
import { ev, randomId, thrown } from '../../../../../test/helpers-routes-public.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const hashOf = async (id: string) =>
	(await db.select().from(users).where(eq(users.id, id)))[0].passwordHash;

describe('profile/settings/password load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/settings/password'
		});
	});

	it('reports whether the user has a password', async () => {
		const google = await makeUser({ passwordHash: null });
		const local = await makeUser({ passwordHash: 'x' });
		expect(await load(ev({ user: google }))).toEqual({ hasPassword: false });
		expect(await load(ev({ user: local }))).toEqual({ hasPassword: true });
		expect(await load(ev({ user: { id: randomId() } as never }))).toEqual({ hasPassword: false });
	});

	it('reads the password hash from locals.user without re-querying the database', async () => {
		expect(await load(ev({ user: { id: randomId(), passwordHash: 'x' } as never }))).toEqual({
			hasPassword: true
		});
	});
});

describe('profile/settings/password change action', () => {
	const pw = { newPassword: 'new-password', confirmPassword: 'new-password' };

	it('redirects anonymous users', async () => {
		expect(await thrown(() => actions.change(ev({ form: pw })))).toMatchObject({ location: '/login' });
	});

	it.each([
		[{ newPassword: '', confirmPassword: 'x' }, 'New password and confirmation are required.'],
		[{ newPassword: 'x' }, 'New password and confirmation are required.'],
		[{ confirmPassword: 'x' }, 'New password and confirmation are required.'],
		[{ newPassword: 'short', confirmPassword: 'short' }, 'New password must be at least 8 characters.'],
		[{ newPassword: 'longenough', confirmPassword: 'different!' }, 'New passwords do not match.']
	])('validates %o', async (form, error) => {
		const user = await makeUser();
		expect(await actions.change(ev({ user, form }))).toMatchObject({ status: 400, data: { error } });
	});

	it('verifies the current password against the hash in locals.user', async () => {
		const user = await makeUser({ passwordHash: await hashPassword('old-password') });
		const stale = { ...user, passwordHash: await hashPassword('locals-password') };
		expect(await actions.change(ev({ user: stale, form: { ...pw, currentPassword: 'old-password' } }))).toMatchObject({
			status: 400,
			data: { error: 'Current password is incorrect.' }
		});
		expect(await actions.change(ev({ user: stale, form: { ...pw, currentPassword: 'locals-password' } }))).toEqual({
			success: true
		});
	});

	it('requires and verifies the current password for password users', async () => {
		const user = await makeUser({ passwordHash: await hashPassword('old-password') });
		expect(await actions.change(ev({ user, form: pw }))).toMatchObject({
			status: 400,
			data: { error: 'Current password is required.' }
		});
		expect(await actions.change(ev({ user, form: { ...pw, currentPassword: 'wrong-one' } }))).toMatchObject({
			status: 400,
			data: { error: 'Current password is incorrect.' }
		});
		expect(await actions.change(ev({ user, form: { ...pw, currentPassword: 'old-password' } }))).toEqual({
			success: true
		});
		expect(await verifyPassword((await hashOf(user.id))!, 'new-password')).toBe(true);
	});

	it('lets Google-only users set a password without a current one', async () => {
		const user = await makeUser({ passwordHash: null });
		expect(await actions.change(ev({ user, form: pw }))).toEqual({ success: true });
		expect(await verifyPassword((await hashOf(user.id))!, 'new-password')).toBe(true);
	});
});
