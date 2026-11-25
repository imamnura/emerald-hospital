import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requirePatient } from '#lib/server/guards.ts';
import { cancelBookingForUser, listAppointmentsForUser } from '#lib/server/booking.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requirePatient(locals, '/appointments');

	const bookedId = url.searchParams.get('booked');
	const appointments = await listAppointmentsForUser(user.id);

	// The list already holds every booking of this user, so no second lookup is needed.
	const confirmedBooking = bookedId ? (appointments.find((a) => a.id === bookedId) ?? null) : null;

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
