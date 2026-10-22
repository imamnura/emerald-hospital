import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getInsuranceForUser, upsertInsurance } from '#lib/server/insurance.ts';

function isoDate(value: FormDataEntryValue | null): string | null {
	const s = String(value ?? '').trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function numericString(value: FormDataEntryValue | null): string | null {
	const s = String(value ?? '').trim();
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/insurance');

	return {
		insurance: await getInsuranceForUser(locals.user.id, locals.user.name)
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const fd = await request.formData();

		const providerName = String(fd.get('providerName') ?? '').trim();
		const planName = String(fd.get('planName') ?? '').trim();
		const memberId = String(fd.get('memberId') ?? '').trim();
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

		await upsertInsurance(locals.user.id, {
			providerName,
			planName,
			memberId,
			groupNo: String(fd.get('groupNo') ?? '').trim() || null,
			planType: String(fd.get('planType') ?? '').trim() || null,
			coverageStart,
			coverageEnd,
			status: fd.get('status') === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
			costPcp: numericString(fd.get('costPcp')),
			costSpecialist: numericString(fd.get('costSpecialist')),
			costEmergency: numericString(fd.get('costEmergency')),
			costRx: numericString(fd.get('costRx')),
			providerPhone: String(fd.get('providerPhone') ?? '').trim() || null
		});

		return { success: true };
	}
};
