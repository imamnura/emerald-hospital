import { hash, verify } from '@node-rs/argon2';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './db';
import { sessions, users, type User } from './db/schema';

export type PublicUser = Omit<User, 'passwordHash' | 'googleId'>;

/** Strip credentials so a user row is safe to serialize to the client. */
export function toPublicUser(user: User): PublicUser {
	const { passwordHash: _passwordHash, googleId: _googleId, ...rest } = user;
	return rest;
}

const SESSION_COOKIE = 'session_id';
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
	return hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
	return verify(hashValue, password);
}

export async function createSession(userId: string): Promise<string> {
	const sessionId = nanoid(32);
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
	await db.insert(sessions).values({ id: sessionId, userId, expiresAt });
	return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteSessionsByUserId(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function validateSession(sessionId: string): Promise<User | null> {
	const [row] = await db
		.select({ user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.limit(1);

	if (!row) return null;

	const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
	if (!session || session.expiresAt < new Date()) {
		await deleteSession(sessionId);
		return null;
	}

	return row.user;
}

/** Create a session for `userId` and set the session cookie. */
export async function setSessionCookie(cookies: Cookies, userId: string): Promise<void> {
	const sessionId = await createSession(userId);
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	});
}

/** Delete the current session (if any) and clear the session cookie. */
export async function endSession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) await deleteSession(sessionId);
	cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
