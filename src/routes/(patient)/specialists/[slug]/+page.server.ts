import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { publicUserOrNull } from '#lib/server/auth/session.ts';
import { getSpecialistBySlug } from '#lib/server/catalog/catalog.ts';
import { listActiveDoctorsBySpecialistId } from '#lib/server/catalog/doctors.ts';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = publicUserOrNull(locals.user);

	const specialist = await getSpecialistBySlug(params.slug);
	if (!specialist) error(404, 'Specialist not found');

	const doctors = (await listActiveDoctorsBySpecialistId(specialist.id))
		.map((d) => ({
			id: d.id,
			name: d.name,
			imageUrl: d.imageUrl,
			rating: d.rating,
			reviewCount: d.reviewCount,
			hospital: d.hospital,
			isOnline: d.isOnline
		}))
		.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

	return { specialist, doctors, user };
};
