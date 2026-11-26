import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeSession, makeUser } from '../../../test/factories.ts';
import {
	SESSION_COOKIE_NAME,
	createSession,
	deleteSession,
	deleteSessionsByUserId,
	endSession,
	hashPassword,
	setSessionCookie,
	toPublicUser,
	validateSession,
	verifyPassword
} from './session.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const sessionRows = (id: string) => db.select().from(sessions).where(eq(sessions.id, id));

describe('toPublicUser', () => {
	it('strips credentials', async () => {
		const u = await makeUser({ googleId: 'g-1' });
		const pub = toPublicUser(u);
		expect(pub).not.toHaveProperty('passwordHash');
		expect(pub).not.toHaveProperty('googleId');
		expect(pub).toMatchObject({ id: u.id, email: u.email, role: u.role });
	});
});

describe('password hashing', () => {
	it('hashes with argon2 and verifies only the right password', async () => {
		const h = await hashPassword('s3cret!');
		expect(h).toMatch(/^\$argon2id\$/);
		expect(h).not.toContain('s3cret!');
		expect(await verifyPassword(h, 's3cret!')).toBe(true);
		expect(await verifyPassword(h, 'wrong')).toBe(false);
	});

	it('produces different hashes for the same password (salted)', async () => {
		expect(await hashPassword('x')).not.toBe(await hashPassword('x'));
	});
});

describe('sessions', () => {
	afterEach(() => vi.useRealTimers());

	it('createSession stores a 32-char id expiring in 30 days', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
		const user = await makeUser();
		const id = await createSession(user.id);
		expect(id).toHaveLength(32);
		const [row] = await sessionRows(id);
		expect(row.userId).toBe(user.id);
		expect(row.expiresAt.toISOString()).toBe('2030-01-31T00:00:00.000Z');
	});

	it('validateSession returns the user for a live session', async () => {
		const user = await makeUser({ name: 'Alice' });
		const id = await createSession(user.id);
		const result = await validateSession(id);
		expect(result?.id).toBe(user.id);
		expect(result?.name).toBe('Alice');
	});

	it('validateSession returns null for an unknown session', async () => {
		expect(await validateSession('nope')).toBeNull();
	});

	it('validateSession deletes and rejects an expired session', async () => {
		const user = await makeUser();
		const id = await makeSession(user.id, new Date(Date.now() - 1000));
		expect(await validateSession(id)).toBeNull();
		expect(await sessionRows(id)).toHaveLength(0);
	});

	it('validateSession reads the user and the expiry in a single query', async () => {
		const user = await makeUser();
		const id = await makeSession(user.id);
		const spy = vi.spyOn(db, 'select');
		try {
			expect((await validateSession(id))?.id).toBe(user.id);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			spy.mockRestore();
		}
	});

	it('deleteSession removes only that session', async () => {
		const user = await makeUser();
		const a = await makeSession(user.id);
		const b = await makeSession(user.id);
		await deleteSession(a);
		expect(await sessionRows(a)).toHaveLength(0);
		expect(await sessionRows(b)).toHaveLength(1);
	});

	it('deleteSessionsByUserId removes all sessions of that user only', async () => {
		const u1 = await makeUser();
		const u2 = await makeUser();
		await makeSession(u1.id);
		await makeSession(u1.id);
		const other = await makeSession(u2.id);
		await deleteSessionsByUserId(u1.id);
		const rest = await db.select().from(sessions);
		expect(rest.map((s) => s.id)).toEqual([other]);
	});
});

describe('session cookie', () => {
	const originalEnv = process.env.NODE_ENV;
	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it('setSessionCookie sets the same options as before', async () => {
		const set = vi.fn();
		const u = await makeUser();
		await setSessionCookie({ set } as unknown as Cookies, u.id);
		expect(set).toHaveBeenCalledWith('session_id', expect.any(String), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 2592000
		});
		const id = set.mock.calls[0][1] as string;
		expect((await validateSession(id))?.id).toBe(u.id);
	});

	it('setSessionCookie is secure in production', async () => {
		process.env.NODE_ENV = 'production';
		const set = vi.fn();
		const u = await makeUser();
		await setSessionCookie({ set } as unknown as Cookies, u.id);
		expect(set.mock.calls[0][2].secure).toBe(true);
	});

	it('endSession deletes the session row and clears the cookie', async () => {
		const u = await makeUser();
		const id = await makeSession(u.id);
		const get = vi.fn().mockReturnValue(id);
		const set = vi.fn();
		await endSession({ get, set } as unknown as Cookies);
		expect(get).toHaveBeenCalledWith('session_id');
		expect(set).toHaveBeenCalledWith('session_id', '', { path: '/', maxAge: 0 });
		expect(await validateSession(id)).toBeNull();
	});

	it('endSession still clears the cookie when there is no session', async () => {
		const set = vi.fn();
		await endSession({ get: () => undefined, set } as unknown as Cookies);
		expect(set).toHaveBeenCalledWith('session_id', '', { path: '/', maxAge: 0 });
	});

	it('exposes the cookie name', () => {
		expect(SESSION_COOKIE_NAME).toBe('session_id');
	});
});
