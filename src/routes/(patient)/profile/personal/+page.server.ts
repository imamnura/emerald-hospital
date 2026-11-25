import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '#lib/server/guards.ts';
import { parseIsoDate } from '#lib/format/date.ts';
import { ISO_DATE_RE } from '#lib/server/http/forms.ts';
import { parseProfileForm, updateProfile } from '#lib/server/users.ts';

const GENDER_FORM_VALUES = ['female', 'male', 'other', 'prefer_not'] as const;
type GenderFormValue = (typeof GENDER_FORM_VALUES)[number];

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
	if (ISO_DATE_RE.test(trimmed)) return trimmed;
	const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!m) return null;
	const [, mm, dd, yyyy] = m;
	const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
	const test = parseIsoDate(iso);
	return Number.isNaN(test.getTime()) ? null : iso;
}

export const load: PageServerLoad = async ({ locals }) => {
	// locals.user is the row hooks loaded for this request; no need to read it again.
	const user = requireUser(locals, '/profile/personal');

	return {
		profile: {
			id: user.id,
			email: user.email,
			name: user.name,
			phone: user.phone,
			imageUrl: user.imageUrl,
			bloodType: user.bloodType,
			address: user.address
		},
		dateOfBirth: formatDobDisplay(user.dateOfBirth ? String(user.dateOfBirth) : null),
		gender: (user.gender ?? 'prefer_not') as GenderFormValue
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const user = requireUser(locals);

		const parsed = parseProfileForm(await request.formData(), {
			nameError: 'Full name is required.',
			parseDob: parseDobInput,
			dobError: 'Enter a valid date of birth (MM/DD/YYYY).',
			genderError: 'Please select a valid gender.'
		});
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await updateProfile(user.id, parsed);

		return { success: true };
	}
};
