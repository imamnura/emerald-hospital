import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { homeFor, sanitizeRedirect } from '#lib/server/auth/redirect.ts';
import { isConfigured as isGoogleConfigured } from '#lib/server/oauth-google.ts';
import { getUserByEmail } from '#lib/server/users.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = url.searchParams.get('redirect');
	const errorMsg = url.searchParams.get('error');
	const resetSuccess = url.searchParams.get('reset') === 'success';

	if (locals.user) {
		throw redirect(303, sanitizeRedirect(redirectTo) ?? homeFor(locals.user.role));
	}

	return {
		redirectTo,
		errorMsg,
		resetSuccess,
		googleEnabled: isGoogleConfigured()
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' });
		}

		const user = await getUserByEmail(email);
		if (!user) {
			return fail(400, { error: 'Invalid email or password.' });
		}
		if (!user.passwordHash) {
			return fail(400, {
				error: 'This account uses Google sign-in. Use the "Continue with Google" button.'
			});
		}
		if (!(await verifyPassword(user.passwordHash, password))) {
			return fail(400, { error: 'Invalid email or password.' });
		}

		await setSessionCookie(cookies, user.id);

		const redirectParam = String(formData.get('redirect') ?? '').trim() || null;
		throw redirect(303, sanitizeRedirect(redirectParam) ?? homeFor(user.role));
	}
};
