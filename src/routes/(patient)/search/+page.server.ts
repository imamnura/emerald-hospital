import type { PageServerLoad } from './$types';
import { listSpecialists } from '#lib/server/catalog/catalog.ts';
import { filterDoctorsByQuery, listActiveDoctors } from '#lib/server/catalog/doctors.ts';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const openFilter = url.searchParams.get('filter') === 'open';

	const [allDoctors, allSpecialists] = await Promise.all([
		listActiveDoctors(),
		listSpecialists()
	]);

	const doctors = q ? filterDoctorsByQuery(allDoctors, q) : allDoctors;

	return {
		query: q,
		doctors,
		allDoctors,
		specialists: allSpecialists,
		openFilter
	};
};
