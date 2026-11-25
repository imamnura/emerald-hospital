import type { LayoutServerLoad } from './$types';
import { toPublicUser } from '#lib/server/auth.ts';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user ? toPublicUser(locals.user) : null };
};
