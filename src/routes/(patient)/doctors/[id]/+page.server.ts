import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listSchedulesForDoctor } from '#lib/server/catalog.ts';
import { getDoctorDetail } from '#lib/server/doctors.ts';
import { DAY_NAMES } from '#lib/utils.ts';

export const load: PageServerLoad = async ({ params }) => {
	const doctor = await getDoctorDetail(params.id);
	if (!doctor) error(404, 'Doctor not found');

	const schedules = await listSchedulesForDoctor(params.id);
	const scheduleDays = schedules.map((s) => DAY_NAMES[s.dayOfWeek]).join(', ');

	return { doctor, schedules, scheduleDays };
};
