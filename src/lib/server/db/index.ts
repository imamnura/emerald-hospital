import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const connectionString = env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/emerald_hospital';

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
