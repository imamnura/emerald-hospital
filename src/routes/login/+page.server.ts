import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import {
	createSession,
	sessionCookieOptions,
	verifyPassword
} from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { isConfigured as isGoogleConfigured } from '#lib/server/oauth-google.ts';

function safeRedirect(path: string | null | undefined, role: 'manager' | 'patient'): string {
	if (path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/login')) {
		return path;
	}
	return role === 'manager' ? '/manager' : '/home';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = url.searchParams.get('redirect');
	const errorMsg = url.searchParams.get('error');
	const resetSuccess = url.searchParams.get('reset') === 'success';

	if (locals.user) {
		throw redirect(303, safeRedirect(redirectTo, locals.user.role));
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

		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

		const sessionId = await createSession(user.id);
		const opts = sessionCookieOptions(sessionId);
		cookies.set(opts.name, opts.value, {
			path: opts.path,
			httpOnly: opts.httpOnly,
			sameSite: opts.sameSite,
			secure: opts.secure,
			maxAge: opts.maxAge
		});

		const redirectParam = String(formData.get('redirect') ?? '').trim() || null;
		throw redirect(303, safeRedirect(redirectParam, user.role));
	}
};
