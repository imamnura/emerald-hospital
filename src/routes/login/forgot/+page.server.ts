import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/home');
};

export const actions: Actions = {
	default: async ({ request }) => {
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

		// Demo: always show success (do not reveal whether the email is registered).
		return { success: true, email };
	}
};
