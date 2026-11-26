import { fail, type ActionFailure } from '@sveltejs/kit';
import { isForeignKeyViolation, isUuid } from '#lib/server/db/errors.ts';

/** Matches a `YYYY-MM-DD` date string. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Trimmed string value of a form field; empty when absent. */
export function formStr(fd: FormData, key: string): string {
	return String(fd.get(key) ?? '').trim();
}

/** Trimmed string value of a form field, or `null` when blank or absent. */
export function formOpt(fd: FormData, key: string): string | null {
	return formStr(fd, key) || null;
}

/**
 * Reads the `id` field of a manager action. Missing -> 400, not a UUID -> 404
 * (Postgres would otherwise throw on a malformed uuid).
 */
export function readEntityId(
	fd: FormData,
	label: string
): { id: string } | ActionFailure<{ error: string }> {
	const id = String(fd.get('id') ?? '');
	if (!id) return fail(400, { error: `Missing ${label} ID.` });
	if (!isUuid(id)) return fail(404, { error: `${label.charAt(0).toUpperCase()}${label.slice(1)} not found.` });
	return { id };
}

/** Runs `op`, mapping a foreign-key violation to `fail(status, { error })`; other errors rethrow. */
export async function withFkGuard<T>(
	op: () => Promise<T>,
	status: 400 | 409,
	error: string
): Promise<T | ActionFailure<{ error: string }>> {
	try {
		return await op();
	} catch (e) {
		if (isForeignKeyViolation(e)) return fail(status, { error });
		throw e;
	}
}
