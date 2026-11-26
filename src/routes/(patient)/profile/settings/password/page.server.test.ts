import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '#lib/server/auth/session.ts';
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

	it('404s when the user row is gone', async () => {
		expect(await actions.change(ev({ user: { id: randomId() } as never, form: pw }))).toMatchObject({
			status: 404
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

	it('load after the action (no-JS submit, same stale locals) reports the new password', async () => {
		const user = await makeUser({ passwordHash: null });
		const event = ev({ user, form: pw });
		expect(await actions.change(event)).toEqual({ success: true });
		// SvelteKit reruns load in the same request: locals.user still has no hash.
		expect(event.locals.user.passwordHash).toBeNull();
		expect(await load(event)).toEqual({ hasPassword: true });
	});

	it('lets Google-only users set a password without a current one', async () => {
		const user = await makeUser({ passwordHash: null });
		expect(await actions.change(ev({ user, form: pw }))).toEqual({ success: true });
		expect(await verifyPassword((await hashOf(user.id))!, 'new-password')).toBe(true);
	});
});
