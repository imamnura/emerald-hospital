import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { doctorSchedules } from '#lib/server/db/schema.ts';
import { createBookingAtomic, getDayOfWeek, getSlotAvailability } from '#lib/server/booking.ts';
import { isUuid } from '#lib/server/db-errors.ts';
import { getDoctorDetail } from '#lib/server/doctors.ts';
import { formatTime12h } from '#lib/utils/booking-ui.ts';
import { doctorRoleLabel } from '#lib/utils/specialist.ts';

export const load: PageServerLoad = async ({ params, url, parent }) => {
	const { user } = await parent();

	const appointmentDate = url.searchParams.get('date') ?? '';
	const appointmentTime = url.searchParams.get('time') ?? '';
	const scheduleId = url.searchParams.get('scheduleId') ?? '';

	if (!appointmentDate || !appointmentTime || !isUuid(scheduleId)) {
		throw redirect(303, `/doctors/${params.id}/book?date=${appointmentDate}`);
	}

	const doctor = await getDoctorDetail(params.id);
	if (!doctor) error(404, 'Doctor not found');

	const [schedule] = await db
		.select()
		.from(doctorSchedules)
		.where(and(eq(doctorSchedules.id, scheduleId), eq(doctorSchedules.doctorId, params.id)))
		.limit(1);

	if (!schedule || schedule.dayOfWeek !== getDayOfWeek(appointmentDate)) {
		throw redirect(303, `/doctors/${params.id}/book?date=${appointmentDate}`);
	}

	const availability = await getSlotAvailability(scheduleId, appointmentDate);
	if ((availability.get(appointmentTime) ?? 0) <= 0) {
		throw redirect(303, `/doctors/${params.id}/book?date=${appointmentDate}`);
	}

	return {
		user,
		appointment: {
			date: appointmentDate,
			time: appointmentTime,
			timeLabel: formatTime12h(appointmentTime),
			scheduleId,
			visitType: 'Initial Consultation'
		},
		doctor: {
			...doctor,
			role: doctorRoleLabel(doctor.specialty, doctor.rating),
			fee: Number(doctor.consultationFee),
			locationLine2: `${doctor.hospitalAddress}, ${doctor.hospitalCity}`
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params, url }) => {
		if (!locals.user) {
			const redirectTo = `/doctors/${params.id}/book/confirm?${url.searchParams}`;
			throw redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`);
		}

		const formData = await request.formData();
		const scheduleId = String(formData.get('scheduleId') ?? '');
		const appointmentDate = String(formData.get('appointmentDate') ?? '');
		const appointmentTime = String(formData.get('appointmentTime') ?? '');

		if (!scheduleId || !appointmentDate || !appointmentTime) {
			return fail(400, { error: 'Missing appointment details.' });
		}

		const result = await createBookingAtomic({
			userId: locals.user.id,
			doctorId: params.id,
			scheduleId,
			appointmentDate,
			appointmentTime
		});

		if (!result.ok) {
			return fail(400, {
				error:
					result.error === 'slot_full'
						? 'Selected slot is no longer available.'
						: 'Invalid schedule for selected date.'
			});
		}

		throw redirect(303, `/appointments?booked=${result.id}`);
	}
};
