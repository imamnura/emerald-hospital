import { db } from '#lib/server/db/index.ts';
import {
	bookings,
	doctorSchedules,
	doctors,
	hospitals,
	insuranceProfiles,
	medicalRecords,
	paymentCards,
	paymentTransactions,
	sessions,
	specialists,
	users
} from '#lib/server/db/schema.ts';

/**
 * Insert helpers for DB-backed tests. Each accepts overrides and returns the inserted row.
 * `db` here is the PGlite instance injected by `setup-server.ts`.
 */
let seq = 0;
const next = () => ++seq;

export async function makeUser(overrides: Partial<typeof users.$inferInsert> = {}) {
	const n = next();
	const [row] = await db
		.insert(users)
		.values({ email: `user${n}@test.com`, name: `User ${n}`, role: 'patient', ...overrides })
		.returning();
	return row;
}

export async function makeManager(overrides: Partial<typeof users.$inferInsert> = {}) {
	return makeUser({ role: 'manager', ...overrides });
}

export async function makeSession(userId: string, expiresAt = new Date(Date.now() + 86_400_000)) {
	const id = `sess-${next()}`;
	await db.insert(sessions).values({ id, userId, expiresAt });
	return id;
}

export async function makeHospital(overrides: Partial<typeof hospitals.$inferInsert> = {}) {
	const n = next();
	const [row] = await db
		.insert(hospitals)
		.values({ name: `Hospital ${n}`, address: `Street ${n}`, city: 'Purwakarta', ...overrides })
		.returning();
	return row;
}

export async function makeSpecialist(overrides: Partial<typeof specialists.$inferInsert> = {}) {
	const n = next();
	const [row] = await db
		.insert(specialists)
		.values({ name: `Specialty ${n}`, slug: `specialty-${n}`, icon: 'heart', ...overrides })
		.returning();
	return row;
}

export async function makeDoctor(overrides: Partial<typeof doctors.$inferInsert> = {}) {
	const hospitalId = overrides.hospitalId ?? (await makeHospital()).id;
	const specialistId = overrides.specialistId ?? (await makeSpecialist()).id;
	const n = next();
	const [row] = await db
		.insert(doctors)
		.values({ name: `Dr. ${n}`, rating: '4.5', ...overrides, hospitalId, specialistId })
		.returning();
	return row;
}

export async function makeSchedule(
	doctorId: string,
	overrides: Partial<typeof doctorSchedules.$inferInsert> = {}
) {
	const [row] = await db
		.insert(doctorSchedules)
		.values({ doctorId, dayOfWeek: 1, startTime: '09:00', endTime: '11:00', maxQuota: 2, ...overrides })
		.returning();
	return row;
}

export async function makeBooking(values: {
	userId: string;
	doctorId: string;
	scheduleId: string;
	appointmentDate?: string;
	appointmentTime?: string;
	status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}) {
	const [row] = await db
		.insert(bookings)
		.values({ appointmentDate: '2030-01-07', appointmentTime: '09:00', ...values })
		.returning();
	return row;
}

export async function makeCard(userId: string, overrides: Partial<typeof paymentCards.$inferInsert> = {}) {
	const [row] = await db
		.insert(paymentCards)
		.values({ userId, brand: 'visa', last4: '4242', expires: '12/30', ...overrides })
		.returning();
	return row;
}

export async function makeTransaction(
	userId: string,
	overrides: Partial<typeof paymentTransactions.$inferInsert> = {}
) {
	const [row] = await db
		.insert(paymentTransactions)
		.values({ userId, title: 'Consultation', amount: '150.00', ...overrides })
		.returning();
	return row;
}

export async function makeInsurance(
	userId: string,
	overrides: Partial<typeof insuranceProfiles.$inferInsert> = {}
) {
	const [row] = await db
		.insert(insuranceProfiles)
		.values({
			userId,
			providerName: 'BPJS',
			planName: 'Gold',
			memberId: 'M-1',
			coverageStart: '2026-01-01',
			coverageEnd: '2026-12-31',
			...overrides
		})
		.returning();
	return row;
}

export async function makeMedicalRecord(
	userId: string,
	overrides: Partial<typeof medicalRecords.$inferInsert> = {}
) {
	const [row] = await db
		.insert(medicalRecords)
		.values({
			userId,
			title: 'Blood test',
			facility: 'Lab A',
			type: 'lab',
			recordDate: '2026-03-01',
			...overrides
		})
		.returning();
	return row;
}

/**
 * Builds the minimal RequestEvent shape that `load` / actions / `+server.ts` handlers use.
 * Form fields go in `form`; they are sent as a urlencoded POST body.
 */
export function makeEvent(opts: {
	url?: string;
	params?: Record<string, string>;
	user?: typeof users.$inferSelect | null;
	form?: Record<string, string>;
	cookies?: Record<string, string>;
	parentData?: Record<string, unknown>;
	method?: string;
}) {
	const url = new URL(opts.url ?? '/', 'http://localhost');
	const jar = new Map(Object.entries(opts.cookies ?? {}));
	const cookies = {
		get: (name: string) => jar.get(name),
		getAll: () => [...jar].map(([name, value]) => ({ name, value })),
		set: (name: string, value: string, _opts?: unknown) => {
			jar.set(name, value);
		},
		delete: (name: string, _opts?: unknown) => {
			jar.delete(name);
		},
		serialize: () => ''
	};
	const body = opts.form ? new URLSearchParams(opts.form) : undefined;
	const request = new Request(url, {
		method: opts.method ?? (body ? 'POST' : 'GET'),
		body,
		headers: body ? { 'content-type': 'application/x-www-form-urlencoded' } : undefined
	});
	return {
		url,
		params: opts.params ?? {},
		locals: { user: opts.user ?? null },
		cookies,
		jar,
		request,
		parent: async () => ({ user: opts.user ?? null, ...(opts.parentData ?? {}) }),
		setHeaders: () => {},
		depends: () => {},
		untrack: <T>(fn: () => T) => fn(),
		fetch: globalThis.fetch,
		getClientAddress: () => '127.0.0.1',
		platform: undefined,
		route: { id: null },
		isDataRequest: false,
		isSubRequest: false,
		isRemoteRequest: false
	};
}
