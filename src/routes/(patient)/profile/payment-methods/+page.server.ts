import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '#lib/server/guards.ts';
import {
	addCardForUser,
	deleteCard,
	listCardsForUser,
	listTransactionsForUser,
	setDefaultCard
} from '#lib/server/payments.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals, '/profile/payment-methods');

	const [savedCards, transactions] = await Promise.all([
		listCardsForUser(user.id),
		listTransactionsForUser(user.id)
	]);

	return { savedCards, transactions };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const user = requireUser(locals);
		const fd = await request.formData();
		const result = await addCardForUser(user.id, {
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
		const user = requireUser(locals);
		const cardId = String((await request.formData()).get('cardId') ?? '');
		if (!cardId) return fail(400, { error: 'Missing card id.' });
		await setDefaultCard(user.id, cardId);
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const user = requireUser(locals);
		const cardId = String((await request.formData()).get('cardId') ?? '');
		if (!cardId) return fail(400, { error: 'Missing card id.' });
		await deleteCard(user.id, cardId);
		return { success: true };
	}
};
