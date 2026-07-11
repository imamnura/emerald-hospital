import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { deleteSessionsByUserId, hashPassword } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { consumePasswordResetToken, findValidPasswordResetToken } from '$lib/server/password-reset';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user) throw redirect(303, '/home');

	const tokenRow = await findValidPasswordResetToken(params.token);
	return { valid: tokenRow !== null };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const tokenRow = await findValidPasswordResetToken(params.token);
		if (!tokenRow) {
			return fail(400, { error: 'This reset link is invalid or has expired.', expired: true });
		}

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', expired: false });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', expired: false });
		}

		const passwordHash = await hashPassword(password);
		await db.update(users).set({ passwordHash }).where(eq(users.id, tokenRow.userId));

		await consumePasswordResetToken(tokenRow.id);
		await deleteSessionsByUserId(tokenRow.userId);

		throw redirect(303, '/login?reset=success');
	}
};
