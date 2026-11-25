import { redirect } from '@sveltejs/kit';
import { and, asc, count, eq, gte, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME, toPublicUser } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { bookings } from '#lib/server/db/schema.ts';
import { toLocalDateString } from '#lib/utils/booking-ui.ts';
import { formatMemberSince, formatNextVisitShort } from '#lib/utils/profile.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile');

	const today = toLocalDateString(new Date());
	const userId = locals.user.id;

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
		profile: toPublicUser(locals.user),
		memberSince: formatMemberSince(locals.user.createdAt),
		stats: {
			bloodType: locals.user.bloodType ?? '—',
			nextVisit: nextBooking ? formatNextVisitShort(String(nextBooking.appointmentDate)) : '—',
			reports: Number(reportsRow?.total ?? 0)
		}
	};
};

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		const sessionId = cookies.get(SESSION_COOKIE_NAME);
		if (sessionId) await deleteSession(sessionId);
		const opts = clearSessionCookie();
		cookies.set(opts.name, opts.value, { path: opts.path, maxAge: opts.maxAge });
		throw redirect(303, '/login');
	}
};
