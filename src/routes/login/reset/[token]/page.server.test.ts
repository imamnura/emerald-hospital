import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { verifyPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { passwordResetTokens, sessions, users } from '#lib/server/db/schema.ts';
import { createPasswordResetToken } from '#lib/server/password-reset.ts';
import { resetDb, type TestDb } from '../../../../test/db.ts';
import { makeSession, makeUser } from '../../../../test/factories.ts';
import { ev, thrown } from '../../../../test/helpers-routes-public.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('reset password load', () => {
	it('redirects signed-in users', async () => {
		expect(
			await thrown(() => load(ev({ user: { id: 'x' } as never, params: { token: 't' } })))
		).toMatchObject({ status: 303, location: '/home' });
	});

	it('reports whether the token is valid', async () => {
		const user = await makeUser();
		const token = await createPasswordResetToken(user.id);
		expect(await load(ev({ params: { token } }))).toEqual({ valid: true });
		expect(await load(ev({ params: { token: 'bogus' } }))).toEqual({ valid: false });
	});
});

describe('reset password action', () => {
	const submit = (token: string, form: Record<string, string>) =>
		actions.default(ev({ params: { token }, form }));

	it('rejects invalid and expired tokens', async () => {
		expect(await submit('bogus', { password: 'longenough', confirmPassword: 'longenough' })).toMatchObject({
			status: 400,
			data: { expired: true }
		});

		const user = await makeUser();
		const token = await createPasswordResetToken(user.id);
		await db.update(passwordResetTokens).set({ expiresAt: new Date(Date.now() - 1000) });
		expect(await submit(token, { password: 'longenough', confirmPassword: 'longenough' })).toMatchObject({
			status: 400,
			data: { expired: true }
		});
	});

	it('validates length and confirmation', async () => {
		const user = await makeUser();
		const token = await createPasswordResetToken(user.id);
		expect(await submit(token, { password: 'short', confirmPassword: 'short' })).toMatchObject({
			status: 400,
			data: { error: 'Password must be at least 8 characters.', expired: false }
		});
		expect(await submit(token, { other: '1' })).toMatchObject({ status: 400 });
		expect(await submit(token, { password: 'longenough', confirmPassword: 'different1' })).toMatchObject({
			status: 400,
			data: { error: 'Passwords do not match.' }
		});
	});

	it('updates the password, consumes the token and signs out every session', async () => {
		const user = await makeUser();
		await makeSession(user.id);
		const token = await createPasswordResetToken(user.id);

		expect(
			await thrown(() => submit(token, { password: 'brand-new-pw', confirmPassword: 'brand-new-pw' }))
		).toMatchObject({ status: 303, location: '/login?reset=success' });

		const [row] = await db.select().from(users).where(eq(users.id, user.id));
		expect(await verifyPassword(row.passwordHash!, 'brand-new-pw')).toBe(true);
		expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(0);
		const [tok] = await db.select().from(passwordResetTokens);
		expect(tok.usedAt).not.toBeNull();
		expect(await load(ev({ params: { token } }))).toEqual({ valid: false });
	});

	it('a reset token cannot be reused after success', async () => {
		const user = await makeUser();
		const token = await createPasswordResetToken(user.id);
		const form = { password: 'brand-new-pw', confirmPassword: 'brand-new-pw' };

		expect(await thrown(() => submit(token, form))).toMatchObject({ status: 303, location: '/login?reset=success' });
		expect(await submit(token, { password: 'another-pw-1', confirmPassword: 'another-pw-1' })).toMatchObject({
			status: 400,
			data: { error: 'This reset link is invalid or has expired.', expired: true }
		});
		const [row] = await db.select().from(users).where(eq(users.id, user.id));
		expect(await verifyPassword(row.passwordHash!, 'brand-new-pw')).toBe(true);
	});

	it('two concurrent resets with one token: exactly one wins, the other gets the invalid-token failure', async () => {
		const user = await makeUser();
		const token = await createPasswordResetToken(user.id);
		const results = await Promise.allSettled([
			submit(token, { password: 'first-password', confirmPassword: 'first-password' }),
			submit(token, { password: 'second-password', confirmPassword: 'second-password' })
		]);
		const wins = results.filter((r) => r.status === 'rejected');
		const losses = results.filter((r) => r.status === 'fulfilled');
		expect(wins).toHaveLength(1);
		expect((wins[0] as PromiseRejectedResult).reason).toMatchObject({ status: 303, location: '/login?reset=success' });
		expect(losses).toHaveLength(1);
		expect((losses[0] as PromiseFulfilledResult<unknown>).value).toMatchObject({
			status: 400,
			data: { error: 'This reset link is invalid or has expired.', expired: true }
		});
		// The stored hash is the winner's password.
		const winner = results[0].status === 'rejected' ? 'first-password' : 'second-password';
		const [row] = await db.select().from(users).where(eq(users.id, user.id));
		expect(await verifyPassword(row.passwordHash!, winner)).toBe(true);
	});

	it('rolls everything back when a step fails: token stays valid, password and sessions untouched', async () => {
		const user = await makeUser({ passwordHash: 'old-hash' });
		await makeSession(user.id);
		const token = await createPasswordResetToken(user.id);
		// Make the last step (signing out every session) fail inside the database.
		await db.execute(sql`
			create or replace function fail_session_delete() returns trigger language plpgsql as
			$$ begin raise exception 'session delete blocked'; end $$
		`);
		await db.execute(sql`
			create trigger block_session_delete before delete on sessions
			for each row execute function fail_session_delete()
		`);
		try {
			await expect(submit(token, { password: 'brand-new-pw', confirmPassword: 'brand-new-pw' })).rejects.toThrow();
		} finally {
			await db.execute(sql`drop trigger block_session_delete on sessions`);
			await db.execute(sql`drop function fail_session_delete()`);
		}

		const [row] = await db.select().from(users).where(eq(users.id, user.id));
		expect(row.passwordHash).toBe('old-hash');
		expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(1);
		expect(await load(ev({ params: { token } }))).toEqual({ valid: true });
	});
});
