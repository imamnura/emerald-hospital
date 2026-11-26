import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { paymentCards } from '#lib/server/db/schema.ts';
import { makeCard, makeTransaction, makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

const cardsOf = (userId: string) => db.select().from(paymentCards).where(eq(paymentCards.userId, userId));

describe('profile/payment-methods load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/payment-methods'
		});
	});

	it('returns saved cards and transactions', async () => {
		const user = await makeUser();
		const card = await makeCard(user.id);
		await makeTransaction(user.id, { cardId: card.id });
		const data = (await load(ev({ user }))) as { savedCards: unknown[]; transactions: unknown[] };
		expect(data.savedCards).toHaveLength(1);
		expect(data.transactions).toHaveLength(1);
	});
});

describe('profile/payment-methods actions', () => {
	it('redirects anonymous users on every action', async () => {
		for (const action of [actions.add, actions.setDefault, actions.delete]) {
			expect(await thrown(() => action(ev({ form: { cardId: 'x' } })))).toMatchObject({
				status: 303,
				location: '/login'
			});
		}
	});

	it('add validates input and stores the card', async () => {
		const user = await makeUser();
		expect(
			await actions.add(ev({ user, form: { brand: 'amex', last4: '1234', expires: '12/30' } }))
		).toMatchObject({ status: 400 });
		expect(await actions.add(ev({ user, form: { other: '1' } }))).toMatchObject({ status: 400 });

		await makeCard(user.id, { isDefault: true });
		expect(
			await actions.add(
				ev({ user, form: { brand: 'mastercard', last4: '5555', expires: '01/29', makeDefault: 'on' } })
			)
		).toEqual({ success: true });
		const cards = await cardsOf(user.id);
		expect(cards.find((c) => c.last4 === '5555')?.isDefault).toBe(true);
		expect(cards.filter((c) => c.isDefault)).toHaveLength(1);
	});

	it('setDefault and delete require a card id and act on the card', async () => {
		const user = await makeUser();
		expect(await actions.setDefault(ev({ user, form: { cardId: '' } }))).toMatchObject({ status: 400 });
		expect(await actions.setDefault(ev({ user, form: { other: '1' } }))).toMatchObject({ status: 400 });
		expect(await actions.delete(ev({ user, form: { other: '1' } }))).toMatchObject({
			status: 400,
			data: { error: 'Missing card id.' }
		});

		const a = await makeCard(user.id, { isDefault: true, last4: '1111' });
		const b = await makeCard(user.id, { isDefault: false, last4: '2222' });

		expect(await actions.setDefault(ev({ user, form: { cardId: b.id } }))).toEqual({ success: true });
		let cards = await cardsOf(user.id);
		expect(cards.find((c) => c.id === b.id)?.isDefault).toBe(true);
		expect(cards.find((c) => c.id === a.id)?.isDefault).toBe(false);

		expect(await actions.delete(ev({ user, form: { cardId: b.id } }))).toEqual({ success: true });
		cards = await cardsOf(user.id);
		expect(cards.map((c) => c.id)).toEqual([a.id]);
	});
});
