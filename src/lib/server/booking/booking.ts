import { and, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { isUuid } from '#lib/server/db/errors.ts';
import { parseIsoDate } from '#lib/format/date.ts';
import { bookings, doctorSchedules, doctors, hospitals, specialists } from '#lib/server/db/schema.ts';

function parseTime(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

function formatTime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** @internal exported for tests */
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

/** The schedule columns slot availability is computed from. */
type ScheduleQuota = Pick<ScheduleSlim, 'id' | 'startTime' | 'endTime' | 'maxQuota'>;

type SlotWithQuota = {
	time: string;
	quota: number;
	scheduleId: string;
};

/**
 * Single GROUP BY query: non-cancelled bookings on `appointmentDate`, counted per
 * schedule and slot time, for every schedule in `scheduleIds` (all must be UUIDs).
 */
async function getBookedCounts(
	scheduleIds: string[],
	appointmentDate: string
): Promise<Map<string, Map<string, number>>> {
	const rows = await db
		.select({
			scheduleId: bookings.scheduleId,
			time: bookings.appointmentTime,
			used: count()
		})
		.from(bookings)
		.where(
			and(
				inArray(bookings.scheduleId, scheduleIds),
				eq(bookings.appointmentDate, appointmentDate),
				ne(bookings.status, 'cancelled')
			)
		)
		.groupBy(bookings.scheduleId, bookings.appointmentTime);

	const out = new Map<string, Map<string, number>>();
	for (const r of rows) {
		let perTime = out.get(r.scheduleId);
		if (!perTime) out.set(r.scheduleId, (perTime = new Map()));
		perTime.set(r.time, Number(r.used));
	}
	return out;
}

/** Remaining quota per slot of `schedule`, given its booked counts per slot time. */
function availabilityFrom(schedule: ScheduleQuota, booked: Map<string, number> | undefined): Map<string, number> {
	const out = new Map<string, number>();
	for (const slot of generateTimeSlots(schedule.startTime, schedule.endTime)) {
		const used = booked?.get(slot) ?? 0;
		out.set(slot, Math.max(0, schedule.maxQuota - used));
	}
	return out;
}

/** Slot availability for a schedule row the caller has already loaded. */
export async function getSlotAvailabilityForSchedule(
	schedule: ScheduleQuota,
	appointmentDate: string
): Promise<Map<string, number>> {
	const booked = await getBookedCounts([schedule.id], appointmentDate);
	return availabilityFrom(schedule, booked.get(schedule.id));
}

/**
 * Merged slots of every schedule on the weekday of `appointmentDate`, keeping the
 * schedule with the most remaining quota per time. Schedule rows are re-read from the
 * database (ids unknown there are skipped): one schedule query + one count query.
 */
export async function getAllSlotsForDoctorDate(
	schedules: ScheduleSlim[],
	appointmentDate: string
): Promise<SlotWithQuota[]> {
	const dayOfWeek = getDayOfWeek(appointmentDate);
	const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
	const ids = [...new Set(daySchedules.map((s) => s.id).filter(isUuid))];
	if (ids.length === 0) return [];

	const [rows, booked] = await Promise.all([
		db.select().from(doctorSchedules).where(inArray(doctorSchedules.id, ids)),
		getBookedCounts(ids, appointmentDate)
	]);
	const byId = new Map(rows.map((r) => [r.id, r]));
	const merged = new Map<string, SlotWithQuota>();

	for (const { id } of daySchedules) {
		const schedule = byId.get(id);
		if (!schedule) continue;
		const availability = availabilityFrom(schedule, booked.get(id));
		for (const [time, quota] of availability) {
			const existing = merged.get(time);
			if (!existing || quota > existing.quota) {
				merged.set(time, { time, quota, scheduleId: schedule.id });
			}
		}
	}

	return [...merged.values()].sort((a, b) => a.time.localeCompare(b.time));
}

/** The `FOR UPDATE`-locked schedule row read by `createBookingAtomic`. */
type LockedSchedule = { dayOfWeek: number; maxQuota: number };

type CreateBookingResult =
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
		// Query builder (not raw `execute`) so the row shape is the same on every driver.
		const locked: LockedSchedule[] = await tx
			.select({ dayOfWeek: doctorSchedules.dayOfWeek, maxQuota: doctorSchedules.maxQuota })
			.from(doctorSchedules)
			.where(and(eq(doctorSchedules.id, input.scheduleId), eq(doctorSchedules.doctorId, input.doctorId)))
			.for('update');
		const [schedule] = locked;

		if (!schedule || schedule.dayOfWeek !== getDayOfWeek(input.appointmentDate)) {
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

		if (Number(used) >= schedule.maxQuota) {
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

function appointmentQuery() {
	return db
		.select(appointmentSelect)
		.from(bookings)
		.innerJoin(doctors, eq(bookings.doctorId, doctors.id))
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id));
}

type AppointmentRow = {
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
	return appointmentQuery()
		.where(eq(bookings.userId, userId))
		.orderBy(desc(bookings.appointmentDate), desc(bookings.appointmentTime));
}

type CancelResult =
	| { ok: true }
	| { ok: false; error: 'not_found' | 'already_cancelled' | 'already_completed' };

const CANCELLABLE = ['pending', 'confirmed'] as const;

export async function cancelBookingForUser(
	userId: string,
	bookingId: string
): Promise<CancelResult> {
	if (!isUuid(bookingId)) return { ok: false, error: 'not_found' };
	const owned = and(eq(bookings.id, bookingId), eq(bookings.userId, userId));

	// One conditional UPDATE does the check and the write atomically.
	const [cancelled] = await db
		.update(bookings)
		.set({ status: 'cancelled' })
		.where(and(owned, inArray(bookings.status, CANCELLABLE)))
		.returning({ id: bookings.id });
	if (cancelled) return { ok: true };

	// Nothing updated: work out why (only on the failure path).
	const [row] = await db.select({ status: bookings.status }).from(bookings).where(owned).limit(1);
	if (row?.status === 'cancelled') return { ok: false, error: 'already_cancelled' };
	if (row?.status === 'completed') return { ok: false, error: 'already_completed' };
	return { ok: false, error: 'not_found' };
}
