import type { LayoutServerLoad } from './$types';
import { publicUserOrNull } from '#lib/server/auth.ts';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: publicUserOrNull(locals.user) };
};
