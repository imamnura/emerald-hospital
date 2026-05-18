import type { PageServerLoad } from './$types';
import { listSpecialists } from '$lib/server/catalog';
import { listActiveDoctors } from '$lib/server/doctors';

export const load: PageServerLoad = async ({ url }) => {
	const specialistSlug = url.searchParams.get('specialist') ?? '';

	const [allSpecialists, allDoctors] = await Promise.all([
		listSpecialists(),
		listActiveDoctors()
	]);

	const filtered = specialistSlug
		? allDoctors.filter((d) => d.specialistSlug === specialistSlug)
		: allDoctors;

	return {
		specialists: allSpecialists,
		doctors: filtered,
		activeSpecialist: specialistSlug
	};
};
