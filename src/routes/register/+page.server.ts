import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hashPassword, setSessionCookie } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { formOpt, formStr } from '#lib/server/http/forms.ts';
import { isConfigured as isGoogleConfigured } from '#lib/server/oauth-google.ts';
import { getUserByEmail } from '#lib/server/users.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/home');
	return { googleEnabled: isGoogleConfigured() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = formStr(formData, 'name');
		const email = formStr(formData, 'email').toLowerCase();
		const phone = formOpt(formData, 'phone');
		const password = String(formData.get('password') ?? '');

		if (!name || !email || password.length < 8) {
			return fail(400, { error: 'Please fill all required fields (password min 8 chars).' });
		}

		const existing = await getUserByEmail(email);
		if (existing) {
			return fail(400, { error: 'Email already registered.' });
		}

		const passwordHash = await hashPassword(password);
		const [user] = await db
			.insert(users)
			.values({ name, email, phone, passwordHash, role: 'patient' })
			.returning();

		await setSessionCookie(cookies, user.id);

		throw redirect(303, '/home');
	}
};
