import type { PageServerLoad } from './$types';
import { requireUser } from '#lib/server/auth/guards.ts';
import { listMedicalRecordsForUser } from '#lib/server/patient/medical-records.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile/medical-records');

	const records = await listMedicalRecordsForUser(user.id);

	return {
		user: {
			name: user.name,
			imageUrl: user.imageUrl
		},
		records
	};
};
