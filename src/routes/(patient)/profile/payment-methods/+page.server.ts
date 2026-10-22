import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	addCardForUser,
	deleteCard,
	listCardsForUser,
	listTransactionsForUser,
	setDefaultCard
} from '#lib/server/payments.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/payment-methods');

	const [savedCards, transactions] = await Promise.all([
		listCardsForUser(locals.user.id),
		listTransactionsForUser(locals.user.id)
	]);

	return { savedCards, transactions };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const fd = await request.formData();
		const result = await addCardForUser(locals.user.id, {
			brand: String(fd.get('brand') ?? ''),
			last4: String(fd.get('last4') ?? ''),
			expires: String(fd.get('expires') ?? ''),
			makeDefault: fd.get('makeDefault') === 'on'
		});
		if (!result.ok) {
			return fail(400, { error: 'Please enter a valid card brand, last 4 digits, and MM/YY.' });
		}
		return { success: true };
	},
	setDefault: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const cardId = String((await request.formData()).get('cardId') ?? '');
		if (!cardId) return fail(400, { error: 'Missing card id.' });
		await setDefaultCard(locals.user.id, cardId);
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const cardId = String((await request.formData()).get('cardId') ?? '');
		if (!cardId) return fail(400, { error: 'Missing card id.' });
		await deleteCard(locals.user.id, cardId);
		return { success: true };
	}
};
