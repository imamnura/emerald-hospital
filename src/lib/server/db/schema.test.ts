import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { passwordResetTokens } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import {
	makeBooking,
	makeCard,
	makeDoctor,
	makeHospital,
	makeInsurance,
	makeMedicalRecord,
	makeSchedule,
	makeSession,
	makeSpecialist,
	makeTransaction,
	makeUser
} from '#test/factories.ts';

const tdb = db as unknown as TestDb;

beforeEach(() => resetDb(tdb));

async function seed() {
	const user = await makeUser({ name: 'Pat' });
	const hospital = await makeHospital({ name: 'Emerald' });
	const specialist = await makeSpecialist({ name: 'Cardio' });
	const doctor = await makeDoctor({ name: 'Dr. X', hospitalId: hospital.id, specialistId: specialist.id });
	const schedule = await makeSchedule(doctor.id);
	const booking = await makeBooking({ userId: user.id, doctorId: doctor.id, scheduleId: schedule.id });
	await makeSession(user.id);
	const [token] = await tdb
		.insert(passwordResetTokens)
		.values({ userId: user.id, tokenHash: 'h'.repeat(64), expiresAt: new Date(Date.now() + 60_000) })
		.returning();
	const card = await makeCard(user.id);
	const tx = await makeTransaction(user.id, { cardId: card.id, bookingId: booking.id });
	const insurance = await makeInsurance(user.id);
	const record = await makeMedicalRecord(user.id);
	return { user, hospital, specialist, doctor, schedule, booking, token, card, tx, insurance, record };
}

describe('schema relations', () => {
	it('users relations', async () => {
		const s = await seed();
		const [u] = await tdb.query.users.findMany({
			with: {
				bookings: true,
				passwordResetTokens: true,
				paymentCards: true,
				paymentTransactions: true,
				insurance: true,
				medicalRecords: true
			}
		});
		expect(u.bookings.map((b) => b.id)).toEqual([s.booking.id]);
		expect(u.passwordResetTokens.map((x) => x.id)).toEqual([s.token.id]);
		expect(u.paymentCards.map((x) => x.id)).toEqual([s.card.id]);
		expect(u.paymentTransactions.map((x) => x.id)).toEqual([s.tx.id]);
		expect(u.insurance?.id).toBe(s.insurance.id);
		expect(u.medicalRecords.map((x) => x.id)).toEqual([s.record.id]);
	});

	it('users.sessions and sessions.user resolve via sessionsRelations', async () => {
		const s = await seed();
		const other = await makeUser();
		const sessionId = await makeSession(s.user.id);
		await makeSession(other.id);

		const users = await tdb.query.users.findMany({ with: { sessions: true } });
		const pat = users.find((u) => u.id === s.user.id)!;
		// seed() already created one session for Pat.
		expect(pat.sessions).toHaveLength(2);
		expect(pat.sessions.map((x) => x.id)).toContain(sessionId);
		expect(pat.sessions.every((x) => x.userId === s.user.id)).toBe(true);
		expect(users.find((u) => u.id === other.id)!.sessions).toHaveLength(1);

		const rows = await tdb.query.sessions.findMany({ with: { user: true } });
		expect(rows).toHaveLength(3);
		const mine = rows.find((r) => r.id === sessionId)!;
		expect(mine.user).toMatchObject({ id: s.user.id, name: 'Pat' });
	});

	it('passwordResetTokens -> user', async () => {
		const s = await seed();
		const [t] = await tdb.query.passwordResetTokens.findMany({ with: { user: true } });
		expect(t.user.id).toBe(s.user.id);
	});

	it('hospitals and specialists -> doctors', async () => {
		const s = await seed();
		const [h] = await tdb.query.hospitals.findMany({ with: { doctors: true } });
		expect(h.doctors.map((d) => d.id)).toEqual([s.doctor.id]);
		const [sp] = await tdb.query.specialists.findMany({ with: { doctors: true } });
		expect(sp.doctors.map((d) => d.id)).toEqual([s.doctor.id]);
	});

	it('doctors relations', async () => {
		const s = await seed();
		const [d] = await tdb.query.doctors.findMany({
			with: { hospital: true, specialist: true, schedules: true, bookings: true }
		});
		expect(d.hospital.name).toBe('Emerald');
		expect(d.specialist.name).toBe('Cardio');
		expect(d.schedules.map((x) => x.id)).toEqual([s.schedule.id]);
		expect(d.bookings.map((x) => x.id)).toEqual([s.booking.id]);
	});

	it('doctorSchedules relations', async () => {
		const s = await seed();
		const [sc] = await tdb.query.doctorSchedules.findMany({ with: { doctor: true, bookings: true } });
		expect(sc.doctor.id).toBe(s.doctor.id);
		expect(sc.bookings.map((x) => x.id)).toEqual([s.booking.id]);
	});

	it('bookings relations', async () => {
		const s = await seed();
		const [b] = await tdb.query.bookings.findMany({ with: { user: true, doctor: true, schedule: true } });
		expect(b.user.id).toBe(s.user.id);
		expect(b.doctor.id).toBe(s.doctor.id);
		expect(b.schedule.id).toBe(s.schedule.id);
	});

	it('payment relations', async () => {
		const s = await seed();
		const [c] = await tdb.query.paymentCards.findMany({ with: { user: true, transactions: true } });
		expect(c.user.id).toBe(s.user.id);
		expect(c.transactions.map((x) => x.id)).toEqual([s.tx.id]);
		const [t] = await tdb.query.paymentTransactions.findMany({
			with: { user: true, card: true, booking: true }
		});
		expect(t.user.id).toBe(s.user.id);
		expect(t.card?.id).toBe(s.card.id);
		expect(t.booking?.id).toBe(s.booking.id);
	});

	it('insurance and medical records -> user', async () => {
		const s = await seed();
		const [i] = await tdb.query.insuranceProfiles.findMany({ with: { user: true } });
		expect(i.user.id).toBe(s.user.id);
		const [m] = await tdb.query.medicalRecords.findMany({ with: { user: true } });
		expect(m.user.id).toBe(s.user.id);
	});
});

describe('schema foreign keys', () => {
	it('every FK points at the intended table/column', async () => {
		const { getTableConfig } = await import('drizzle-orm/pg-core');
		const schema = await import('./schema.ts');
		const tables = [
			schema.users,
			schema.sessions,
			schema.passwordResetTokens,
			schema.hospitals,
			schema.specialists,
			schema.doctors,
			schema.doctorSchedules,
			schema.bookings,
			schema.paymentCards,
			schema.paymentTransactions,
			schema.insuranceProfiles,
			schema.medicalRecords
		];
		const fks: string[] = [];
		for (const t of tables) {
			const cfg = getTableConfig(t);
			for (const fk of cfg.foreignKeys) {
				const ref = fk.reference();
				const target = getTableConfig(ref.foreignTable).name;
				fks.push(
					`${cfg.name}.${ref.columns.map((c) => c.name).join()} -> ${target}.${ref.foreignColumns
						.map((c) => c.name)
						.join()} (${fk.onDelete ?? 'no action'})`
				);
			}
		}
		expect(fks.sort()).toEqual(
			[
				'sessions.user_id -> users.id (cascade)',
				'password_reset_tokens.user_id -> users.id (cascade)',
				'doctors.hospital_id -> hospitals.id (no action)',
				'doctors.specialist_id -> specialists.id (no action)',
				'doctor_schedules.doctor_id -> doctors.id (cascade)',
				'bookings.user_id -> users.id (no action)',
				'bookings.doctor_id -> doctors.id (no action)',
				'bookings.schedule_id -> doctor_schedules.id (no action)',
				'payment_cards.user_id -> users.id (cascade)',
				'payment_transactions.user_id -> users.id (cascade)',
				'payment_transactions.card_id -> payment_cards.id (set null)',
				'payment_transactions.booking_id -> bookings.id (set null)',
				'insurance_profiles.user_id -> users.id (cascade)',
				'medical_records.user_id -> users.id (cascade)'
			].sort()
		);
	});

	it('has indexes on hot foreign keys', async () => {
		const res = await tdb.execute(sql`select indexname from pg_indexes where schemaname = 'public'`);
		const names = (res.rows as { indexname: string }[]).map((r) => r.indexname);
		for (const n of [
			'sessions_user_id_idx',
			'doctors_hospital_id_idx',
			'doctors_specialist_id_idx',
			'doctor_schedules_doctor_id_idx',
			'bookings_doctor_id_idx',
			'bookings_created_at_idx',
			'payment_cards_user_id_idx',
			'payment_transactions_card_id_idx'
		])
			expect(names).toContain(n);
	});
});
