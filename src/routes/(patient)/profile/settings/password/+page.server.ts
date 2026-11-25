import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyPassword } from '#lib/server/auth.ts';
import { requireUser } from '#lib/server/guards.ts';
import { setPassword } from '#lib/server/users.ts';

// locals.user is the full server-side row (hash included), loaded by hooks for this request.

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile/settings/password');
	return { hasPassword: Boolean(user.passwordHash) };
};

export const actions: Actions = {
	change: async ({ request, locals }) => {
		const user = requireUser(locals);

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

		if (user.passwordHash) {
			if (!currentPassword) {
				return fail(400, { error: 'Current password is required.' });
			}
			const valid = await verifyPassword(user.passwordHash, currentPassword);
			if (!valid) return fail(400, { error: 'Current password is incorrect.' });
		}

		await setPassword(user.id, newPassword);

		return { success: true };
	}
};
