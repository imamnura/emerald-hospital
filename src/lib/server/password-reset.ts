import crypto from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db, type DbExecutor } from './db';
import { passwordResetTokens, type User } from './db/schema';
import { sendMail } from './mailer';

const TOKEN_TTL_MINUTES = 60;

function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

/** Invalidates any outstanding reset links and issues a fresh one-time token. */
export async function createPasswordResetToken(userId: string): Promise<string> {
	await db
		.delete(passwordResetTokens)
		.where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));

	const token = crypto.randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

	await db.insert(passwordResetTokens).values({
		userId,
		tokenHash: hashToken(token),
		expiresAt
	});

	return token;
}

export async function findValidPasswordResetToken(token: string) {
	const [row] = await db
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.tokenHash, hashToken(token)))
		.limit(1);

	if (!row) return null;
	if (row.usedAt) return null;
	if (row.expiresAt < new Date()) return null;

	return row;
}

export async function consumePasswordResetToken(id: string, executor: DbExecutor = db): Promise<void> {
	await executor.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
}

export async function sendPasswordResetEmail(user: User, resetUrl: string): Promise<void> {
	await sendMail({
		to: user.email,
		subject: 'Reset your Purwakarta Health password',
		text: `Hi ${user.name},\n\nWe received a request to reset your password. Open the link below to choose a new one — it expires in ${TOKEN_TTL_MINUTES} minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
		html: `
			<p>Hi ${user.name},</p>
			<p>We received a request to reset your password. Click the button below to choose a new one — this link expires in ${TOKEN_TTL_MINUTES} minutes.</p>
			<p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0f766e;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
			<p>If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
			<p>If you didn't request this, you can safely ignore this email.</p>
		`
	});
}
