import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listSchedulesForDoctor } from '#lib/server/catalog/catalog.ts';
import { getDoctorDetail } from '#lib/server/catalog/doctors.ts';
import { DAY_NAMES } from '#lib/format/date.ts';

export const load: PageServerLoad = async ({ params }) => {
	const [doctor, schedules] = await Promise.all([
		getDoctorDetail(params.id),
		listSchedulesForDoctor(params.id)
	]);
	if (!doctor) error(404, 'Doctor not found');

	const scheduleDays = schedules.map((s) => DAY_NAMES[s.dayOfWeek]).join(', ');

	return { doctor, schedules, scheduleDays };
};
