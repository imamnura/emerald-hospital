import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPasswordResetToken, sendPasswordResetEmail } from '#lib/server/password-reset.ts';
import { getUserByEmail } from '#lib/server/users.ts';

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
		const user = await getUserByEmail(email);
		if (user) {
			const token = await createPasswordResetToken(user.id);
			const resetUrl = `${url.origin}/login/reset/${token}`;
			await sendPasswordResetEmail(user, resetUrl);
		}

		return { success: true, email };
	}
};
