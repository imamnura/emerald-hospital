import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { toPublicUser } from '#lib/server/auth.ts';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/manager');
	if (locals.user.role !== 'manager') throw redirect(303, '/home');
	return { user: toPublicUser(locals.user) };
};
