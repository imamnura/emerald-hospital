import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '#lib/server/guards.ts';
import { parseIsoDate } from '#lib/format/date.ts';
import { getUserById, parseProfileForm, updateProfile } from '#lib/server/users.ts';

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

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile/personal');

	const fresh = await getUserById(user.id);
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
		const user = requireUser(locals);

		const parsed = parseProfileForm(await request.formData());
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await updateProfile(user.id, parsed);

		return { success: true };
	}
};
