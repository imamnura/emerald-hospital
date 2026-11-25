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

/** Per-caller overrides; the defaults are the lenient rules used by `parseProfileForm` on its own. */
export type ProfileFormRules = {
	nameError?: string;
	/** Normalises a non-empty date of birth to `YYYY-MM-DD`, or `null` when invalid. */
	parseDob?: (raw: string) => string | null;
	dobError?: string;
	/** When set, gender is mandatory: `prefer_not` maps to `null`, anything else unknown fails with this message. */
	genderError?: string;
};

export function parseProfileForm(
	fd: FormData,
	rules: ProfileFormRules = {}
): ProfileUpdate | { error: string } {
	const name = formStr(fd, 'name');
	if (!name) return { error: rules.nameError ?? 'Name is required.' };
	const phone = formOpt(fd, 'phone');
	const imageUrl = formOpt(fd, 'imageUrl');

	const dobRaw = formOpt(fd, 'dateOfBirth');
	const parseDob = rules.parseDob ?? ((raw: string) => (ISO_DATE_RE.test(raw) ? raw : null));
	const dateOfBirth = dobRaw ? parseDob(dobRaw) : null;
	if (dobRaw && !dateOfBirth) return { error: rules.dobError ?? 'Invalid date of birth.' };

	const genderRaw = formStr(fd, 'gender');
	let gender: ProfileUpdate['gender'] = null;
	if (rules.genderError !== undefined) {
		if (genderRaw !== 'prefer_not' && !ALLOWED_GENDER.has(genderRaw)) {
			return { error: rules.genderError };
		}
		if (genderRaw !== 'prefer_not') gender = genderRaw as NonNullable<ProfileUpdate['gender']>;
	} else if (ALLOWED_GENDER.has(genderRaw)) {
		gender = genderRaw as NonNullable<ProfileUpdate['gender']>;
	}

	const bloodRaw = formStr(fd, 'bloodType');
	const bloodType = bloodRaw ? (ALLOWED_BLOOD.has(bloodRaw) ? bloodRaw : null) : null;
	if (bloodRaw && !bloodType) return { error: 'Invalid blood type.' };

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
