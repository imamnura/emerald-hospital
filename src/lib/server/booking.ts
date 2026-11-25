import { and, count, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from './db';
import { isUuid } from './db-errors';
import { parseIsoDate } from '#lib/format/date.ts';
import { bookings, doctorSchedules, doctors, hospitals, specialists } from './db/schema';

export function parseTime(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

export function formatTime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeSlots(startTime: string, endTime: string, intervalMinutes = 30): string[] {
	const start = parseTime(startTime);
	const end = parseTime(endTime);
	const slots: string[] = [];
	for (let t = start; t < end; t += intervalMinutes) {
		slots.push(formatTime(t));
	}
	return slots;
}

export function getDayOfWeek(dateStr: string): number {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return NaN;
	return parseIsoDate(dateStr).getDay();
}

type ScheduleSlim = {
	id: string;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	maxQuota: number;
};

export type SlotWithQuota = {
	time: string;
	quota: number;
	scheduleId: string;
};

/**
 * Single GROUP BY query that returns booked counts per slot for one schedule on one date.
 * Replaces the previous N×slots count loop.
 */
async function getBookedCounts(
	scheduleId: string,
	appointmentDate: string
): Promise<Map<string, number>> {
	const rows = await db
		.select({
			time: bookings.appointmentTime,
			used: count()
		})
		.from(bookings)
		.where(
			and(
				eq(bookings.scheduleId, scheduleId),
				eq(bookings.appointmentDate, appointmentDate),
				ne(bookings.status, 'cancelled')
			)
		)
		.groupBy(bookings.appointmentTime);

	return new Map(rows.map((r) => [r.time, Number(r.used)]));
}

export async function getSlotAvailability(
	scheduleId: string,
	appointmentDate: string
): Promise<Map<string, number>> {
	if (!isUuid(scheduleId)) return new Map();
	const [schedule] = await db
		.select()
		.from(doctorSchedules)
		.where(eq(doctorSchedules.id, scheduleId))
		.limit(1);

	if (!schedule) return new Map();

	const slots = generateTimeSlots(schedule.startTime, schedule.endTime);
	const booked = await getBookedCounts(scheduleId, appointmentDate);
	const out = new Map<string, number>();
	for (const slot of slots) {
		const used = booked.get(slot) ?? 0;
		out.set(slot, Math.max(0, schedule.maxQuota - used));
	}
	return out;
}

export async function getAllSlotsForDoctorDate(
	schedules: ScheduleSlim[],
	appointmentDate: string
): Promise<SlotWithQuota[]> {
	const dayOfWeek = getDayOfWeek(appointmentDate);
	const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
	const merged = new Map<string, SlotWithQuota>();

	for (const schedule of daySchedules) {
		const availability = await getSlotAvailability(schedule.id, appointmentDate);
		for (const [time, quota] of availability) {
			const existing = merged.get(time);
			if (!existing || quota > existing.quota) {
				merged.set(time, { time, quota, scheduleId: schedule.id });
			}
		}
	}

	return [...merged.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export type CreateBookingResult =
	| { ok: true; id: string }
	| { ok: false; error: 'invalid_schedule' | 'slot_full' };

/**
 * Race-safe booking creation:
 * - Wraps everything in a transaction
 * - Locks the schedule row with FOR UPDATE
 * - Re-counts used quota inside the lock
 * - Inserts only if a slot is still available
 */
export async function createBookingAtomic(input: {
	userId: string;
	doctorId: string;
	scheduleId: string;
	appointmentDate: string;
	appointmentTime: string;
}): Promise<CreateBookingResult> {
	if (!isUuid(input.scheduleId) || !isUuid(input.doctorId)) {
		return { ok: false, error: 'invalid_schedule' };
	}
	return db.transaction(async (tx) => {
		const lockedSchedule = await tx.execute(sql`
			select id, doctor_id, day_of_week, max_quota
			from doctor_schedules
			where id = ${input.scheduleId} and doctor_id = ${input.doctorId}
			for update
		`);

		const schedule = (lockedSchedule as unknown as { rows?: Array<{ day_of_week: number; max_quota: number }> })
			.rows?.[0] ?? (lockedSchedule as unknown as Array<{ day_of_week: number; max_quota: number }>)[0];

		if (!schedule || schedule.day_of_week !== getDayOfWeek(input.appointmentDate)) {
			return { ok: false, error: 'invalid_schedule' as const };
		}

		const [{ used = 0 } = { used: 0 }] = await tx
			.select({ used: count() })
			.from(bookings)
			.where(
				and(
					eq(bookings.scheduleId, input.scheduleId),
					eq(bookings.appointmentDate, input.appointmentDate),
					eq(bookings.appointmentTime, input.appointmentTime),
					ne(bookings.status, 'cancelled')
				)
			);

		if (Number(used) >= schedule.max_quota) {
			return { ok: false, error: 'slot_full' as const };
		}

		const [created] = await tx
			.insert(bookings)
			.values({
				userId: input.userId,
				doctorId: input.doctorId,
				scheduleId: input.scheduleId,
				appointmentDate: input.appointmentDate,
				appointmentTime: input.appointmentTime,
				status: 'pending'
			})
			.returning({ id: bookings.id });

		return { ok: true as const, id: created.id };
	});
}

const appointmentSelect = {
	id: bookings.id,
	doctorId: bookings.doctorId,
	appointmentDate: bookings.appointmentDate,
	appointmentTime: bookings.appointmentTime,
	status: bookings.status,
	createdAt: bookings.createdAt,
	doctorName: doctors.name,
	doctorImage: doctors.imageUrl,
	doctorRating: doctors.rating,
	specialty: specialists.name,
	hospital: hospitals.name
};

export type AppointmentRow = {
	id: string;
	doctorId: string;
	appointmentDate: string;
	appointmentTime: string;
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	createdAt: Date;
	doctorName: string;
	doctorImage: string | null;
	doctorRating: string | null;
	specialty: string;
	hospital: string;
};

export async function listAppointmentsForUser(userId: string): Promise<AppointmentRow[]> {
	return db
		.select(appointmentSelect)
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(eq(bookings.userId, userId))
		.orderBy(desc(bookings.appointmentDate), desc(bookings.appointmentTime));
}

export async function getAppointmentForUser(
	userId: string,
	bookingId: string
): Promise<AppointmentRow | null> {
	if (!isUuid(bookingId)) return null;
	const [row] = await db
		.select(appointmentSelect)
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
		.limit(1);
	return row ?? null;
}

export type CancelResult =
	| { ok: true }
	| { ok: false; error: 'not_found' | 'already_cancelled' | 'already_completed' };

export async function cancelBookingForUser(
	userId: string,
	bookingId: string
): Promise<CancelResult> {
	if (!isUuid(bookingId)) return { ok: false, error: 'not_found' };
	const [row] = await db
		.select({ id: bookings.id, status: bookings.status })
		.from(bookings)
		.where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
		.limit(1);

	if (!row) return { ok: false, error: 'not_found' };
	if (row.status === 'cancelled') return { ok: false, error: 'already_cancelled' };
	if (row.status === 'completed') return { ok: false, error: 'already_completed' };

	await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, bookingId));
	return { ok: true };
}
