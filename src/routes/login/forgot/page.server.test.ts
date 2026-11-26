import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { passwordResetTokens } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());
afterEach(() => vi.restoreAllMocks());

describe('forgot password load', () => {
	it('redirects signed-in users home, renders for anonymous', async () => {
		expect(await thrown(() => load(ev({ user: { id: 'x' } as never })))).toMatchObject({
			status: 303,
			location: '/home'
		});
		expect(await load(ev())).toBeUndefined();
	});
});

describe('forgot password action', () => {
	it('validates the email', async () => {
		expect(await actions.default(ev({ form: { email: '  ' } }))).toMatchObject({
			status: 400,
			data: { error: 'Email address is required.' }
		});
		expect(await actions.default(ev({ form: { other: '1' } }))).toMatchObject({ status: 400 });
		expect(await actions.default(ev({ form: { email: 'not-an-email' } }))).toMatchObject({
			status: 400,
			data: { error: 'Please enter a valid email address.' }
		});
	});

	it('reports success for unknown emails without creating a token', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		expect(await actions.default(ev({ form: { email: 'Ghost@X.com' } }))).toEqual({
			success: true,
			email: 'ghost@x.com'
		});
		expect(await db.select().from(passwordResetTokens)).toHaveLength(0);
		expect(log).not.toHaveBeenCalled();
	});

	it('creates a token and "sends" the reset link for real users', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const user = await makeUser({ email: 'real@x.com' });
		expect(
			await actions.default(ev({ url: 'http://localhost/login/forgot', form: { email: 'real@x.com' } }))
		).toEqual({ success: true, email: 'real@x.com' });
		const rows = await db
			.select()
			.from(passwordResetTokens)
			.where(eq(passwordResetTokens.userId, user.id));
		expect(rows).toHaveLength(1);
		expect(log).toHaveBeenCalledOnce();
		expect(String(log.mock.calls[0][0])).toMatch(/http:\/\/localhost\/login\/reset\/[\w-]+/);
	});
});
