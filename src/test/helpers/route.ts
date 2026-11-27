import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../db.ts';
import { makeEvent, makeUser } from '../factories.ts';

/**
 * Shared helpers for server route tests (`src/routes/**`).
 * Route handlers are typed against generated `./$types`; tests pass the fake event
 * from `makeEvent` loosely so one helper fits every load/action/handler signature.
 */

/** A syntactically valid UUID that never matches a seeded row. */
export const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/** Builds a fake RequestEvent cast to whatever handler type the caller needs (defaults to `any`). */
export function ev<T = any>(opts: Parameters<typeof makeEvent>[0] = {}): T {
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

export type ActionResult = { status?: number; data?: { error?: string }; success?: boolean; message?: string };

/** Awaits `fn` and returns whatever it threw (redirect / HttpError), failing if it resolved. */
export async function thrown(fn: () => unknown): Promise<{ status: number; location?: string; body?: { message: string } }> {
	try {
		await fn();
	} catch (e) {
		return e as { status: number; location?: string };
	}
	throw new Error('expected function to throw');
}

/** A Monday far in the future (matches the factory defaults: dayOfWeek 1, 2030-01-07). */
export const MONDAY = '2030-01-07';
export const TUESDAY = '2030-01-08';

export const randomId = () => crypto.randomUUID();
