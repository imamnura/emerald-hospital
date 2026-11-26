import type { PageServerLoad } from './$types';
import { filterDoctorsByQuery, listActiveDoctors } from '#lib/server/catalog/doctors.ts';
import { listHospitals } from '#lib/server/catalog/catalog.ts';
import { publicUserOrNull } from '#lib/server/auth/session.ts';

export const load: PageServerLoad = async ({ url, locals }) => {
	const user = publicUserOrNull(locals.user);

	const q = url.searchParams.get('q')?.trim() ?? '';
	const hospitalParam = url.searchParams.get('hospital')?.trim() ?? '';

	const [allDoctors, allHospitals] = await Promise.all([
		listActiveDoctors(),
		listHospitals()
	]);

	let doctors = q ? filterDoctorsByQuery(allDoctors, q) : allDoctors;

	if (hospitalParam && hospitalParam !== 'all') {
		const needle = hospitalParam.toLowerCase().replace(/-/g, ' ');
		const filtered = doctors.filter((d) => d.hospital.toLowerCase().includes(needle));
		if (filtered.length > 0) doctors = filtered;
	}

	return {
		user,
		query: q,
		hospital: hospitalParam || 'all',
		doctors,
		hospitals: allHospitals
	};
};
