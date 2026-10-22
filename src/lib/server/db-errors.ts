const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres rejects non-UUID values for uuid columns with a raw error, so check first. */
export function isUuid(value: string): boolean {
	return UUID_RE.test(value);
}

/**
 * True for Postgres foreign-key violations (SQLSTATE 23503). Drizzle may wrap the
 * driver error, so the code is checked on the error and on its `cause`.
 */
export function isForeignKeyViolation(error: unknown): boolean {
	const code = (e: unknown) => (e as { code?: unknown } | null)?.code;
	return code(error) === '23503' || code((error as { cause?: unknown } | null)?.cause) === '23503';
}
