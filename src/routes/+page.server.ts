import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role === 'manager') {
		throw redirect(303, '/manager');
	}
	if (locals.user?.role === 'patient') {
		throw redirect(303, '/home');
	}
	return {};
};
