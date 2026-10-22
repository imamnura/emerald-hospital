import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	cancelBookingForUser,
	getAppointmentForUser,
	listAppointmentsForUser
} from '#lib/server/booking.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/appointments');
	if (locals.user.role !== 'patient') throw redirect(303, '/manager');

	const bookedId = url.searchParams.get('booked');
	const appointments = await listAppointmentsForUser(locals.user.id);

	let confirmedBooking = bookedId
		? (appointments.find((a) => a.id === bookedId) ??
			(await getAppointmentForUser(locals.user.id, bookedId)))
		: null;

	return { appointments, confirmedBooking };
};

export const actions: Actions = {
	cancel: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Please sign in again.' });
		if (locals.user.role !== 'patient') return fail(403, { message: 'Not allowed.' });

		const bookingId = (await request.formData()).get('bookingId');
		if (typeof bookingId !== 'string' || !bookingId) {
			return fail(400, { message: 'Invalid appointment.' });
		}

		const result = await cancelBookingForUser(locals.user.id, bookingId);
		if (!result.ok) {
			const messages = {
				not_found: 'Appointment not found.',
				already_cancelled: 'This appointment is already cancelled.',
				already_completed: 'Completed appointments cannot be cancelled.'
			};
			return fail(400, { message: messages[result.error] });
		}

		return { success: true };
	}
};
