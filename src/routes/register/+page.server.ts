import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { createSession, hashPassword, sessionCookieOptions } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { isConfigured as isGoogleConfigured } from '#lib/server/oauth-google.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/home');
	return { googleEnabled: isGoogleConfigured() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const phone = String(formData.get('phone') ?? '').trim() || null;
		const password = String(formData.get('password') ?? '');

		if (!name || !email || password.length < 8) {
			return fail(400, { error: 'Please fill all required fields (password min 8 chars).' });
		}

		const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existing) {
			return fail(400, { error: 'Email already registered.' });
		}

		const passwordHash = await hashPassword(password);
		const [user] = await db
			.insert(users)
			.values({ name, email, phone, passwordHash, role: 'patient' })
			.returning();

		const sessionId = await createSession(user.id);
		const opts = sessionCookieOptions(sessionId);
		cookies.set(opts.name, opts.value, {
			path: opts.path,
			httpOnly: opts.httpOnly,
			sameSite: opts.sameSite,
			secure: opts.secure,
			maxAge: opts.maxAge
		});

		throw redirect(303, '/home');
	}
};
