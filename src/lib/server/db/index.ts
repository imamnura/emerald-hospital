import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as env from '$app/env/private';
import * as schema from '#lib/server/db/schema.ts';

const connectionString = env.DATABASE_URL;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

/** `db` itself or a `db.transaction` handle — for helpers that can also run inside a transaction. */
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
