import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listSchedulesForDoctor } from '$lib/server/catalog';
import { getDoctorDetail } from '$lib/server/doctors';
import { getAllSlotsForDoctorDate } from '$lib/server/booking';
import {
	formatTime12h,
	generateCalendarDays,
	pickDefaultDate,
	type TimeSlotUi
} from '$lib/utils/booking-ui';
import { doctorRoleLabel } from '$lib/utils/specialist';

export const load: PageServerLoad = async ({ params, url, parent }) => {
	const { user } = await parent();

	const doctor = await getDoctorDetail(params.id);
	if (!doctor) error(404, 'Doctor not found');

	const schedules = await listSchedulesForDoctor(params.id);

	const availableDays = [...new Set(schedules.map((s) => s.dayOfWeek))];
	const calendarDays = generateCalendarDays(availableDays);
	const requestedDate = url.searchParams.get('date') ?? '';
	const selectedDate = pickDefaultDate(calendarDays, requestedDate);

	let slots: TimeSlotUi[] = [];
	if (selectedDate) {
		const rawSlots = await getAllSlotsForDoctorDate(schedules, selectedDate);
		slots = rawSlots.map((slot) => {
			const hour = Number(slot.time.split(':')[0]);
			return {
				time: slot.time,
				label: formatTime12h(slot.time),
				quota: slot.quota,
				scheduleId: slot.scheduleId,
				period: hour < 12 ? 'morning' : 'afternoon',
				isFull: slot.quota <= 0
			};
		});
	}

	return {
		user,
		doctor: {
			...doctor,
			role: doctorRoleLabel(doctor.specialty, doctor.rating)
		},
		schedules,
		calendarDays,
		selectedDate,
		slots,
		availableDays,
		monthLabel: selectedDate
			? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
					month: 'long',
					year: 'numeric'
				})
			: ''
	};
};
