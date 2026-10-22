import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '#lib/server/db/schema.ts';

/**
 * In-memory Postgres (PGlite) with the real migrations from `drizzle/`.
 * `setup-server.ts` mocks `#lib/server/db/index.ts` with this, so every server
 * module talks to a real database without Docker. One instance per test file.
 */
export async function createTestDb() {
	const client = new PGlite();
	const db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder: 'drizzle' });
	return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const TABLES = [
	'payment_transactions',
	'payment_cards',
	'insurance_profiles',
	'medical_records',
	'bookings',
	'doctor_schedules',
	'doctors',
	'specialists',
	'hospitals',
	'password_reset_tokens',
	'sessions',
	'users'
];

/** Wipes every table. Call in `beforeEach` of DB-backed tests. */
export async function resetDb(db: TestDb): Promise<void> {
	await db.execute(sql.raw(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`));
}
