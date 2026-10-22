import { describe, expect, it, vi } from 'vitest';

vi.unmock('#lib/server/db/index.ts');

const { postgresMock, drizzleMock, fakeClient, fakeDb } = vi.hoisted(() => {
	const fakeClient = { kind: 'postgres-client' };
	const fakeDb = { kind: 'drizzle-db' };
	return {
		fakeClient,
		fakeDb,
		postgresMock: vi.fn(() => fakeClient),
		drizzleMock: vi.fn(() => fakeDb)
	};
});

vi.mock('postgres', () => ({ default: postgresMock }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: drizzleMock }));

describe('db client', () => {
	it('connects postgres-js with DATABASE_URL (no prepared statements) and wraps it in drizzle with the schema', async () => {
		const schema = await import('./schema.ts');
		const { db } = await import('./index.ts');

		expect(postgresMock).toHaveBeenCalledTimes(1);
		expect(postgresMock).toHaveBeenCalledWith('postgresql://test:test@localhost:5432/test', { prepare: false });
		expect(drizzleMock).toHaveBeenCalledTimes(1);
		const [client, opts] = drizzleMock.mock.calls[0] as unknown as [unknown, { schema: Record<string, unknown> }];
		expect(client).toBe(fakeClient);
		expect(opts.schema.users).toBe(schema.users);
		expect(opts.schema.bookingsRelations).toBe(schema.bookingsRelations);
		expect(db).toBe(fakeDb);
	});
});
