import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { passwordResetTokens } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeUser } from '../../test/factories.ts';
import { sendMail } from './mailer.ts';
import {
	consumePasswordResetToken,
	createPasswordResetToken,
	findValidPasswordResetToken,
	sendPasswordResetEmail
} from './password-reset.ts';

vi.mock('./mailer.ts', () => ({ sendMail: vi.fn(async () => {}) }));

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

beforeEach(() => resetDb(db as unknown as TestDb));
afterEach(() => {
	vi.useRealTimers();
	vi.mocked(sendMail).mockClear();
});

describe('createPasswordResetToken', () => {
	it('stores only the sha256 hash with a 60 minute expiry', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
		const u = await makeUser();
		const token = await createPasswordResetToken(u.id);
		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

		const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, u.id));
		expect(rows).toHaveLength(1);
		expect(rows[0].tokenHash).toBe(sha256(token));
		expect(rows[0].tokenHash).not.toBe(token);
		expect(rows[0].expiresAt.toISOString()).toBe('2026-06-15T11:00:00.000Z');
		expect(rows[0].usedAt).toBeNull();
	});

	it('invalidates earlier unused tokens but keeps used ones and other users', async () => {
		const u = await makeUser();
		const other = await makeUser();
		const used = await createPasswordResetToken(u.id);
		const usedRow = await findValidPasswordResetToken(used);
		await consumePasswordResetToken(usedRow!.id);
		const stale = await createPasswordResetToken(u.id);
		const otherToken = await createPasswordResetToken(other.id);

		const fresh = await createPasswordResetToken(u.id);
		expect(fresh).not.toBe(stale);
		expect(await findValidPasswordResetToken(stale)).toBeNull();
		expect(await findValidPasswordResetToken(fresh)).not.toBeNull();
		expect(await findValidPasswordResetToken(otherToken)).not.toBeNull();

		const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, u.id));
		expect(rows).toHaveLength(2); // the used one + the fresh one
	});
});

describe('findValidPasswordResetToken', () => {
	it('returns the row for a valid token', async () => {
		const u = await makeUser();
		const token = await createPasswordResetToken(u.id);
		expect(await findValidPasswordResetToken(token)).toMatchObject({ userId: u.id, usedAt: null });
	});

	it('returns null for unknown tokens', async () => {
		expect(await findValidPasswordResetToken('nope')).toBeNull();
	});

	it('returns null once expired', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
		const u = await makeUser();
		const token = await createPasswordResetToken(u.id);
		vi.setSystemTime(new Date('2026-06-15T10:59:59Z'));
		expect(await findValidPasswordResetToken(token)).not.toBeNull();
		vi.setSystemTime(new Date('2026-06-15T11:00:01Z'));
		expect(await findValidPasswordResetToken(token)).toBeNull();
	});

	it('is single-use: null after consumption', async () => {
		const u = await makeUser();
		const token = await createPasswordResetToken(u.id);
		const row = await findValidPasswordResetToken(token);
		await consumePasswordResetToken(row!.id);
		expect(await findValidPasswordResetToken(token)).toBeNull();
		const [stored] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.id, row!.id));
		expect(stored.usedAt).toBeInstanceOf(Date);
	});
});

describe('sendPasswordResetEmail', () => {
	it('emails the user the reset link in text and html', async () => {
		const u = await makeUser({ name: 'Rina', email: 'rina@test.com' });
		await sendPasswordResetEmail(u, 'https://app/reset?token=abc');
		expect(sendMail).toHaveBeenCalledTimes(1);
		const args = vi.mocked(sendMail).mock.calls[0][0];
		expect(args.to).toBe('rina@test.com');
		expect(args.subject).toBe('Reset your Purwakarta Health password');
		expect(args.text).toContain('Hi Rina');
		expect(args.text).toContain('https://app/reset?token=abc');
		expect(args.text).toContain('60 minutes');
		expect(args.html).toContain('href="https://app/reset?token=abc"');
		expect(args.html).toContain('Hi Rina');
	});
});
