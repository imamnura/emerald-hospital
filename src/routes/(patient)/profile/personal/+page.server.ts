import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseIsoDate } from '#lib/format/date.ts';
import { getUserById, updateProfile } from '#lib/server/users.ts';

const GENDER_FORM_VALUES = ['female', 'male', 'other', 'prefer_not'] as const;
type GenderFormValue = (typeof GENDER_FORM_VALUES)[number];

const ALLOWED_BLOOD = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

/** MM/DD/YYYY for display in the form */
function formatDobDisplay(iso: string | null): string {
	if (!iso) return '';
	const d = parseIsoDate(iso);
	if (Number.isNaN(d.getTime())) return '';
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${mm}/${dd}/${d.getFullYear()}`;
}

/** Parse MM/DD/YYYY or YYYY-MM-DD into ISO YYYY-MM-DD */
function parseDobInput(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
	const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!m) return null;
	const [, mm, dd, yyyy] = m;
	const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
	const test = parseIsoDate(iso);
	return Number.isNaN(test.getTime()) ? null : iso;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/personal');

	const fresh = await getUserById(locals.user.id);
	if (!fresh) throw redirect(303, '/login');

	return {
		profile: {
			id: fresh.id,
			email: fresh.email,
			name: fresh.name,
			phone: fresh.phone,
			imageUrl: fresh.imageUrl,
			bloodType: fresh.bloodType,
			address: fresh.address
		},
		dateOfBirth: formatDobDisplay(fresh.dateOfBirth ? String(fresh.dateOfBirth) : null),
		gender: (fresh.gender ?? 'prefer_not') as GenderFormValue
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Full name is required.' });

		const phone = String(fd.get('phone') ?? '').trim() || null;
		const imageUrl = String(fd.get('imageUrl') ?? '').trim() || null;
		const address = String(fd.get('address') ?? '').trim() || null;

		const dobInput = String(fd.get('dateOfBirth') ?? '').trim();
		const dateOfBirth = dobInput ? parseDobInput(dobInput) : null;
		if (dobInput && !dateOfBirth) {
			return fail(400, { error: 'Enter a valid date of birth (MM/DD/YYYY).' });
		}

		const genderRaw = String(fd.get('gender') ?? '') as GenderFormValue;
		if (!GENDER_FORM_VALUES.includes(genderRaw)) {
			return fail(400, { error: 'Please select a valid gender.' });
		}
		const gender = genderRaw === 'prefer_not' ? null : genderRaw;

		const bloodRaw = String(fd.get('bloodType') ?? '').trim();
		const bloodType = bloodRaw ? (ALLOWED_BLOOD.has(bloodRaw) ? bloodRaw : null) : null;
		if (bloodRaw && !bloodType) {
			return fail(400, { error: 'Invalid blood type.' });
		}

		await updateProfile(locals.user.id, {
			name,
			phone,
			imageUrl,
			dateOfBirth,
			gender,
			bloodType,
			address
		});

		return { success: true };
	}
};
