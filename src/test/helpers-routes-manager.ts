import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from './db.ts';
import { makeEvent, makeManager, makeUser } from './factories.ts';

/**
 * Shared helpers for the `src/routes/manager/**` server tests.
 */

/** A syntactically valid UUID that never matches a seeded row. */
export const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/** Builds a fake RequestEvent cast to whatever handler type the caller needs. */
export function ev<T>(opts: Parameters<typeof makeEvent>[0]): T {
	return makeEvent(opts) as unknown as T;
}

export function reset(): Promise<void> {
	return resetDb(db as unknown as TestDb);
}

/** Anonymous + patient: the two principals every manager action must reject. */
export async function nonManagers() {
	const patient = await makeUser();
	return [null, patient] as const;
}

export { makeManager };

export type ActionResult = { status?: number; data?: { error?: string }; success?: boolean; message?: string };
