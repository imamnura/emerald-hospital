import type { User } from '#lib/server/db/schema.ts';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
	}
}

export {};
