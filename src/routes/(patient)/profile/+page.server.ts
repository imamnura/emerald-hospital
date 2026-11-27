import { redirect } from '@sveltejs/kit';
import { and, asc, count, eq, gte, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { endSession, toPublicUser } from '#lib/server/auth/session.ts';
import { requireUser } from '#lib/server/auth/guards.ts';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import { formatDate, toLocalDateString } from '#lib/format/date.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile');

	const today = toLocalDateString(new Date());
	const userId = user.id;

	const [nextRows, reportsRows] = await Promise.all([
		db
			.select({ appointmentDate: bookings.appointmentDate })
			.from(bookings)
			.where(
				and(
					eq(bookings.userId, userId),
					inArray(bookings.status, ['pending', 'confirmed']),
					gte(bookings.appointmentDate, today)
				)
			)
			.orderBy(asc(bookings.appointmentDate))
			.limit(1),
		db
			.select({ total: count() })
			.from(bookings)
			.where(and(eq(bookings.userId, userId), eq(bookings.status, 'completed')))
	]);

	const nextBooking = nextRows[0];
	const reportsRow = reportsRows[0];

	return {
		profile: toPublicUser(user),
		memberSince: formatDate(user.createdAt, 'monthYearShort'),
		stats: {
			bloodType: user.bloodType ?? '—',
			nextVisit: nextBooking ? formatDate(String(nextBooking.appointmentDate), 'dayMonth') : '—',
			reports: Number(reportsRow?.total ?? 0)
		}
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		await endSession(cookies);
		throw redirect(303, '/login');
	}
};
