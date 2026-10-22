import { makeEvent } from './factories.ts';

/**
 * Route handlers are typed against generated `./$types`; tests pass the fake event
 * from `makeEvent` loosely so one helper fits every load/action/handler signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ev = (o: Parameters<typeof makeEvent>[0] = {}): any => makeEvent(o);

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
