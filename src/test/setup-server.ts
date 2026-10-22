import { afterEach, vi } from 'vitest';
import { resetEnv } from './mocks/env-private.ts';

// Every server module imports the Drizzle client from here (directly or via `./db`).
vi.mock('#lib/server/db/index.ts', async () => {
	const { createTestDb } = await import('./db.ts');
	return { db: await createTestDb() };
});

afterEach(() => {
	resetEnv();
	vi.unstubAllGlobals();
});
