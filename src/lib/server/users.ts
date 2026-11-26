import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';
import { db, type DbExecutor } from './db';
import { parseIsoDate } from '#lib/format/date.ts';
import { formOpt, formStr, ISO_DATE_RE } from './http/forms.ts';
import { BLOOD_TYPES, GENDERS, users, type User } from './db/schema';

type ProfileUpdate = {
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

/** Parse MM/DD/YYYY or YYYY-MM-DD into ISO YYYY-MM-DD */
function parseDobInput(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (ISO_DATE_RE.test(trimmed)) return trimmed;
	const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!m) return null;
	const [, mm, dd, yyyy] = m;
	const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
	const test = parseIsoDate(iso);
	return Number.isNaN(test.getTime()) ? null : iso;
}

export function parseProfileForm(fd: FormData): ProfileUpdate | { error: string } {
	const name = formStr(fd, 'name');
	if (!name) return { error: 'Full name is required.' };
	const phone = formOpt(fd, 'phone');
	const imageUrl = formOpt(fd, 'imageUrl');

	const dobRaw = formOpt(fd, 'dateOfBirth');
	const dateOfBirth = dobRaw ? parseDobInput(dobRaw) : null;
	if (dobRaw && !dateOfBirth) return { error: 'Enter a valid date of birth (MM/DD/YYYY).' };

	// Gender is mandatory: `prefer_not` maps to null, anything else unknown fails.
	const genderRaw = formStr(fd, 'gender');
	if (genderRaw !== 'prefer_not' && !ALLOWED_GENDER.has(genderRaw)) {
		return { error: 'Please select a valid gender.' };
	}
	const gender =
		genderRaw === 'prefer_not' ? null : (genderRaw as NonNullable<ProfileUpdate['gender']>);

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
	await setPasswordHash(userId, await hashPassword(plain));
}

/** Stores an already computed hash — lets callers hash before opening a transaction. */
export async function setPasswordHash(userId: string, passwordHash: string, executor: DbExecutor = db): Promise<void> {
	await executor.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function getUserById(userId: string) {
	const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	return row ?? null;
}
