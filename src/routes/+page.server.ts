import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { homeFor } from '#lib/server/auth/redirect.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, homeFor(locals.user.role));
	return {};
};
