import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';
import { db } from './db';
import { formOpt, formStr, ISO_DATE_RE } from './http/forms.ts';
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
	const name = formStr(fd, 'name');
	if (!name) return { error: 'Name is required.' };
	const phone = formOpt(fd, 'phone');
	const imageUrl = formOpt(fd, 'imageUrl');

	const bloodRaw = formStr(fd, 'bloodType');
	const bloodType = bloodRaw ? (ALLOWED_BLOOD.has(bloodRaw) ? bloodRaw : null) : null;
	if (bloodRaw && !bloodType) return { error: 'Invalid blood type.' };

	const dateOfBirth = formOpt(fd, 'dateOfBirth');
	if (dateOfBirth && !ISO_DATE_RE.test(dateOfBirth)) {
		return { error: 'Invalid date of birth.' };
	}

	const genderRaw = formStr(fd, 'gender') as 'male' | 'female' | 'other' | '';
	const gender = genderRaw && ALLOWED_GENDER.has(genderRaw) ? genderRaw : null;

	const address = formOpt(fd, 'address');

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
