import { hash } from '@node-rs/argon2';

/**
 * Argon2 hashing with the app's cost settings. Kept free of db/env imports so that
 * `scripts/seed.ts` (plain tsx, no SvelteKit runtime) can use the same options.
 */
export async function hashPassword(password: string): Promise<string> {
	return hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}
