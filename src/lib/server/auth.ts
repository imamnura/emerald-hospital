import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './db';
import { sessions, users, type User } from './db/schema';

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

export function sessionCookieOptions(sessionId: string) {
	return {
		name: SESSION_COOKIE,
		value: sessionId,
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	};
}

export function clearSessionCookie() {
	return {
		name: SESSION_COOKIE,
		value: '',
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		maxAge: 0
	};
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
