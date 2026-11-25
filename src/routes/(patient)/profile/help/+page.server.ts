import type { PageServerLoad } from './$types';
import { requireUser } from '#lib/server/guards.ts';

export const load: PageServerLoad = async ({ locals }) => {
	requireUser(locals, '/profile/help');
	return {};
};
