import { relations } from 'drizzle-orm';
import {
	boolean,
	date,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { BOOKING_STATUSES } from '#lib/domain/booking-status.ts';

export const userRoleEnum = pgEnum('user_role', ['manager', 'patient']);
export const bookingStatusEnum = pgEnum('booking_status', BOOKING_STATUSES);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const cardBrandEnum = pgEnum('card_brand', ['visa', 'mastercard']);
export const CARD_BRANDS = cardBrandEnum.enumValues;
export const GENDERS = genderEnum.enumValues;
/** Not a DB enum (column is free text); single list shared by profile forms. */
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const insuranceStatusEnum = pgEnum('insurance_status', ['ACTIVE', 'INACTIVE']);
export const medicalRecordTypeEnum = pgEnum('medical_record_type', ['lab', 'imaging', 'clinical']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: text('password_hash'),
	emailVerified: boolean('email_verified').notNull().default(false),
	googleId: varchar('google_id', { length: 64 }).unique(),
	role: userRoleEnum('role').notNull().default('patient'),
	name: varchar('name', { length: 255 }).notNull(),
	phone: varchar('phone', { length: 50 }),
	imageUrl: text('image_url'),
	bloodType: varchar('blood_type', { length: 4 }),
	dateOfBirth: date('date_of_birth'),
	gender: genderEnum('gender'),
	address: text('address'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
	},
	(t) => [index('sessions_user_id_idx').on(t.userId)]
);

export const passwordResetTokens = pgTable(
	'password_reset_tokens',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		usedAt: timestamp('used_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('password_reset_tokens_user_idx').on(t.userId)]
);

export const hospitals = pgTable('hospitals', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	address: text('address').notNull(),
	city: varchar('city', { length: 100 }).notNull(),
	imageUrl: text('image_url'),
	contact: varchar('contact', { length: 100 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const specialists = pgTable('specialists', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 100 }).notNull().unique(),
	icon: varchar('icon', { length: 50 }),
	imageUrl: text('image_url')
});

export const doctors = pgTable(
	'doctors',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: varchar('name', { length: 255 }).notNull(),
		hospitalId: uuid('hospital_id')
			.notNull()
			.references(() => hospitals.id),
		specialistId: uuid('specialist_id')
			.notNull()
			.references(() => specialists.id),
		imageUrl: text('image_url'),
		rating: varchar('rating', { length: 10 }).default('4.5'),
		reviewCount: integer('review_count').notNull().default(0),
		consultationFee: numeric('consultation_fee', { precision: 10, scale: 2 }).notNull().default('150'),
		bio: text('bio'),
		isActive: boolean('is_active').default(true).notNull(),
		isOnline: boolean('is_online').default(false).notNull()
	},
	(t) => [index('doctors_hospital_id_idx').on(t.hospitalId), index('doctors_specialist_id_idx').on(t.specialistId)]
);

export const doctorSchedules = pgTable(
	'doctor_schedules',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		doctorId: uuid('doctor_id')
			.notNull()
			.references(() => doctors.id, { onDelete: 'cascade' }),
		dayOfWeek: integer('day_of_week').notNull(),
		startTime: varchar('start_time', { length: 5 }).notNull(),
		endTime: varchar('end_time', { length: 5 }).notNull(),
		maxQuota: integer('max_quota').notNull().default(5)
	},
	(t) => [index('doctor_schedules_doctor_id_idx').on(t.doctorId)]
);

export const bookings = pgTable(
	'bookings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		doctorId: uuid('doctor_id')
			.notNull()
			.references(() => doctors.id),
		scheduleId: uuid('schedule_id')
			.notNull()
			.references(() => doctorSchedules.id),
		appointmentDate: date('appointment_date').notNull(),
		appointmentTime: varchar('appointment_time', { length: 5 }).notNull(),
		status: bookingStatusEnum('status').notNull().default('pending'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('bookings_slot_idx').on(t.scheduleId, t.appointmentDate, t.appointmentTime, t.status),
		index('bookings_user_date_idx').on(t.userId, t.appointmentDate),
		index('bookings_doctor_id_idx').on(t.doctorId),
		index('bookings_created_at_idx').on(t.createdAt)
	]
);

export const paymentCards = pgTable(
	'payment_cards',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		brand: cardBrandEnum('brand').notNull(),
		last4: varchar('last4', { length: 4 }).notNull(),
		expires: varchar('expires', { length: 5 }).notNull(),
		isDefault: boolean('is_default').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('payment_cards_user_id_idx').on(t.userId)]
);

export const paymentTransactions = pgTable(
	'payment_transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		cardId: uuid('card_id').references(() => paymentCards.id, { onDelete: 'set null' }),
		bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
		title: varchar('title', { length: 255 }).notNull(),
		amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
		currency: varchar('currency', { length: 3 }).notNull().default('USD'),
		paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('payment_tx_user_date_idx').on(t.userId, t.paidAt),
		index('payment_transactions_card_id_idx').on(t.cardId)
	]
);

export const insuranceProfiles = pgTable(
	'insurance_profiles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		providerName: varchar('provider_name', { length: 100 }).notNull(),
		planName: varchar('plan_name', { length: 100 }).notNull(),
		memberId: varchar('member_id', { length: 50 }).notNull(),
		groupNo: varchar('group_no', { length: 50 }),
		planType: varchar('plan_type', { length: 50 }),
		coverageStart: date('coverage_start').notNull(),
		coverageEnd: date('coverage_end').notNull(),
		status: insuranceStatusEnum('status').notNull().default('ACTIVE'),
		costPcp: numeric('cost_pcp', { precision: 10, scale: 2 }),
		costSpecialist: numeric('cost_specialist', { precision: 10, scale: 2 }),
		costEmergency: numeric('cost_emergency', { precision: 10, scale: 2 }),
		costRx: numeric('cost_rx', { precision: 10, scale: 2 }),
		providerPhone: varchar('provider_phone', { length: 30 }),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [uniqueIndex('insurance_user_unique').on(t.userId)]
);

export const medicalRecords = pgTable(
	'medical_records',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: varchar('title', { length: 255 }).notNull(),
		facility: varchar('facility', { length: 255 }).notNull(),
		type: medicalRecordTypeEnum('type').notNull(),
		recordDate: date('record_date').notNull(),
		fileUrl: text('file_url'),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('medical_records_user_date_idx').on(t.userId, t.recordDate)]
);

export const usersRelations = relations(users, ({ many, one }) => ({
	bookings: many(bookings),
	sessions: many(sessions),
	passwordResetTokens: many(passwordResetTokens),
	paymentCards: many(paymentCards),
	paymentTransactions: many(paymentTransactions),
	insurance: one(insuranceProfiles),
	medicalRecords: many(medicalRecords)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] })
}));

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
	doctors: many(doctors)
}));

export const specialistsRelations = relations(specialists, ({ many }) => ({
	doctors: many(doctors)
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
	hospital: one(hospitals, { fields: [doctors.hospitalId], references: [hospitals.id] }),
	specialist: one(specialists, {
		fields: [doctors.specialistId],
		references: [specialists.id]
	}),
	schedules: many(doctorSchedules),
	bookings: many(bookings)
}));

export const doctorSchedulesRelations = relations(doctorSchedules, ({ one, many }) => ({
	doctor: one(doctors, { fields: [doctorSchedules.doctorId], references: [doctors.id] }),
	bookings: many(bookings)
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	user: one(users, { fields: [bookings.userId], references: [users.id] }),
	doctor: one(doctors, { fields: [bookings.doctorId], references: [doctors.id] }),
	schedule: one(doctorSchedules, {
		fields: [bookings.scheduleId],
		references: [doctorSchedules.id]
	})
}));

export const paymentCardsRelations = relations(paymentCards, ({ one, many }) => ({
	user: one(users, { fields: [paymentCards.userId], references: [users.id] }),
	transactions: many(paymentTransactions)
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
	user: one(users, { fields: [paymentTransactions.userId], references: [users.id] }),
	card: one(paymentCards, { fields: [paymentTransactions.cardId], references: [paymentCards.id] }),
	booking: one(bookings, {
		fields: [paymentTransactions.bookingId],
		references: [bookings.id]
	})
}));

export const insuranceProfilesRelations = relations(insuranceProfiles, ({ one }) => ({
	user: one(users, { fields: [insuranceProfiles.userId], references: [users.id] })
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
	user: one(users, { fields: [medicalRecords.userId], references: [users.id] })
}));

export type User = typeof users.$inferSelect;
export type Hospital = typeof hospitals.$inferSelect;
export type Specialist = typeof specialists.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type DoctorSchedule = typeof doctorSchedules.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type PaymentCard = typeof paymentCards.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsuranceProfile = typeof insuranceProfiles.$inferSelect;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
