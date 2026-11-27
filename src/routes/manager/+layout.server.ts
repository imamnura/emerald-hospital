import type { LayoutServerLoad } from './$types';
import { toPublicUser } from '#lib/server/auth/session.ts';
import { requireManager } from '#lib/server/auth/guards.ts';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Literal (not url.pathname): this layout wraps every /manager/* page.
	const user = requireManager(locals, '/manager');
	return { user: toPublicUser(user) };
};
