import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listMedicalRecordsForUser } from '$lib/server/medical-records';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/medical-records');

	const records = await listMedicalRecordsForUser(locals.user.id);

	return {
		user: {
			name: locals.user.name,
			imageUrl: locals.user.imageUrl
		},
		records
	};
};
