import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeSession, makeUser } from '../../test/factories.ts';
import {
	SESSION_COOKIE_NAME,
	clearSessionCookie,
	createSession,
	deleteSession,
	deleteSessionsByUserId,
	hashPassword,
	sessionCookieOptions,
	toPublicUser,
	validateSession,
	verifyPassword
} from './auth.ts';

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

	it('validateSession handles the session vanishing between queries', async () => {
		const user = await makeUser();
		const id = await makeSession(user.id);
		const realSelect = db.select.bind(db);
		let calls = 0;
		const spy = vi.spyOn(db, 'select').mockImplementation(((...args: unknown[]) => {
			calls++;
			if (calls === 2) {
				// Second lookup (the session itself) finds nothing.
				return {
					from: () => ({ where: () => ({ limit: async () => [] }) })
				};
			}
			return (realSelect as (...a: unknown[]) => unknown)(...args);
		}) as never);
		try {
			expect(await validateSession(id)).toBeNull();
		} finally {
			spy.mockRestore();
		}
		expect(await sessionRows(id)).toHaveLength(0);
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

describe('cookie options', () => {
	const originalEnv = process.env.NODE_ENV;
	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it('sessionCookieOptions is insecure outside production', () => {
		process.env.NODE_ENV = 'test';
		expect(sessionCookieOptions('abc')).toEqual({
			name: 'session_id',
			value: 'abc',
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 30 * 24 * 60 * 60
		});
	});

	it('sessionCookieOptions is secure in production', () => {
		process.env.NODE_ENV = 'production';
		expect(sessionCookieOptions('abc').secure).toBe(true);
	});

	it('clearSessionCookie expires the cookie', () => {
		expect(clearSessionCookie()).toEqual({
			name: SESSION_COOKIE_NAME,
			value: '',
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 0
		});
		expect(SESSION_COOKIE_NAME).toBe('session_id');
	});
});
