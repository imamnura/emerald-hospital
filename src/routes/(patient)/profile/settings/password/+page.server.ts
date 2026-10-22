import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { hashPassword, verifyPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/settings/password');

	const [user] = await db
		.select({ passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, locals.user.id))
		.limit(1);

	return { hasPassword: Boolean(user?.passwordHash) };
};

export const actions: Actions = {
	change: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!newPassword || !confirmPassword) {
			return fail(400, { error: 'New password and confirmation are required.' });
		}
		if (newPassword.length < 8) {
			return fail(400, { error: 'New password must be at least 8 characters.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match.' });
		}

		const [user] = await db
			.select({ passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, locals.user.id))
			.limit(1);

		if (!user) return fail(404, { error: 'User not found.' });

		if (user.passwordHash) {
			if (!currentPassword) {
				return fail(400, { error: 'Current password is required.' });
			}
			const valid = await verifyPassword(user.passwordHash, currentPassword);
			if (!valid) return fail(400, { error: 'Current password is incorrect.' });
		}

		const passwordHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash }).where(eq(users.id, locals.user.id));

		return { success: true };
	}
};
