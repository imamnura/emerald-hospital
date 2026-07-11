import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createPasswordResetToken, sendPasswordResetEmail } from '$lib/server/password-reset';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/home');
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const email = String((await request.formData()).get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, { error: 'Email address is required.' });
		}

		const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		if (!emailValid) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}

		// Always report success regardless of outcome, so the response can't be
		// used to enumerate which emails are registered.
		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (user) {
			const token = await createPasswordResetToken(user.id);
			const resetUrl = `${url.origin}/login/reset/${token}`;
			await sendPasswordResetEmail(user, resetUrl);
		}

		return { success: true, email };
	}
};
