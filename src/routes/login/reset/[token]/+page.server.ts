import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSessionsByUserId, hashPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { consumePasswordResetToken, findValidPasswordResetToken } from '#lib/server/password-reset.ts';
import { setPasswordHash } from '#lib/server/users.ts';

const INVALID_TOKEN = { error: 'This reset link is invalid or has expired.', expired: true };

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user) throw redirect(303, '/home');

	const tokenRow = await findValidPasswordResetToken(params.token);
	return { valid: tokenRow !== null };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const tokenRow = await findValidPasswordResetToken(params.token);
		if (!tokenRow) return fail(400, INVALID_TOKEN);

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', expired: false });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', expired: false });
		}

		// Hash before opening the transaction so it is not held open during argon2.
		const passwordHash = await hashPassword(password);

		// All-or-nothing: a failure leaves the token usable and the old password + sessions intact.
		const consumed = await db.transaction(async (tx) => {
			// Conditional consume: a concurrent request that used the token first wins.
			if (!(await consumePasswordResetToken(tokenRow.id, tx))) return false;
			await setPasswordHash(tokenRow.userId, passwordHash, tx);
			await deleteSessionsByUserId(tokenRow.userId, tx);
			return true;
		});
		if (!consumed) return fail(400, INVALID_TOKEN);

		throw redirect(303, '/login?reset=success');
	}
};
