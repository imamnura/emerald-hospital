import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '#lib/server/auth/guards.ts';
import { formOpt, formStr, ISO_DATE_RE } from '#lib/server/http/forms.ts';
import { getInsuranceForUser, upsertInsurance } from '#lib/server/patient/insurance.ts';

function isoDate(value: FormDataEntryValue | null): string | null {
	const s = String(value ?? '').trim();
	return ISO_DATE_RE.test(s) ? s : null;
}

function numericString(value: FormDataEntryValue | null): string | null {
	const s = String(value ?? '').trim();
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile/insurance');

	return {
		insurance: await getInsuranceForUser(user.id, user.name)
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const user = requireUser(locals);
		const fd = await request.formData();

		const providerName = formStr(fd, 'providerName');
		const planName = formStr(fd, 'planName');
		const memberId = formStr(fd, 'memberId');
		const coverageStart = isoDate(fd.get('coverageStart'));
		const coverageEnd = isoDate(fd.get('coverageEnd'));

		if (!providerName || !planName || !memberId || !coverageStart || !coverageEnd) {
			return fail(400, {
				error: 'Provider, plan, member ID, and coverage dates are required.'
			});
		}

		if (coverageEnd < coverageStart) {
			return fail(400, { error: 'Coverage end must be after start.' });
		}

		await upsertInsurance(user.id, {
			providerName,
			planName,
			memberId,
			groupNo: formOpt(fd, 'groupNo'),
			planType: formOpt(fd, 'planType'),
			coverageStart,
			coverageEnd,
			status: fd.get('status') === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
			costPcp: numericString(fd.get('costPcp')),
			costSpecialist: numericString(fd.get('costSpecialist')),
			costEmergency: numericString(fd.get('costEmergency')),
			costRx: numericString(fd.get('costRx')),
			providerPhone: formOpt(fd, 'providerPhone')
		});

		return { success: true };
	}
};
