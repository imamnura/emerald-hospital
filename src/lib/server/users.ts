import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';
import { db } from './db';
import { BLOOD_TYPES, GENDERS, users, type User } from './db/schema';

export type ProfileUpdate = {
	name?: string;
	phone?: string | null;
	imageUrl?: string | null;
	bloodType?: string | null;
	dateOfBirth?: string | null;
	gender?: 'male' | 'female' | 'other' | null;
	address?: string | null;
};

const ALLOWED_BLOOD: ReadonlySet<string> = new Set(BLOOD_TYPES);
const ALLOWED_GENDER: ReadonlySet<string> = new Set(GENDERS);

export function parseProfileForm(fd: FormData): ProfileUpdate | { error: string } {
	const name = String(fd.get('name') ?? '').trim();
	if (!name) return { error: 'Name is required.' };
	const phone = String(fd.get('phone') ?? '').trim() || null;
	const imageUrl = String(fd.get('imageUrl') ?? '').trim() || null;

	const bloodRaw = String(fd.get('bloodType') ?? '').trim();
	const bloodType = bloodRaw ? (ALLOWED_BLOOD.has(bloodRaw) ? bloodRaw : null) : null;
	if (bloodRaw && !bloodType) return { error: 'Invalid blood type.' };

	const dobRaw = String(fd.get('dateOfBirth') ?? '').trim();
	const dateOfBirth = dobRaw || null;
	if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
		return { error: 'Invalid date of birth.' };
	}

	const genderRaw = String(fd.get('gender') ?? '').trim() as 'male' | 'female' | 'other' | '';
	const gender = genderRaw && ALLOWED_GENDER.has(genderRaw) ? genderRaw : null;

	const address = String(fd.get('address') ?? '').trim() || null;

	return { name, phone, imageUrl, bloodType, dateOfBirth, gender, address };
}

export async function updateProfile(userId: string, patch: ProfileUpdate) {
	const [row] = await db
		.update(users)
		.set(patch)
		.where(eq(users.id, userId))
		.returning();
	return row;
}

/** Callers pass an already trimmed + lowercased email. */
export async function getUserByEmail(email: string): Promise<User | undefined> {
	const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return row;
}

export async function setPassword(userId: string, plain: string): Promise<void> {
	const passwordHash = await hashPassword(plain);
	await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function getUserById(userId: string) {
	const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	return row ?? null;
}
