import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { paymentCards, paymentTransactions } from './db/schema';

export type CardBrand = 'visa' | 'mastercard';

const BRANDS: ReadonlySet<CardBrand> = new Set(['visa', 'mastercard']);

function isBrand(value: string): value is CardBrand {
	return BRANDS.has(value as CardBrand);
}

export async function listCardsForUser(userId: string) {
	return db
		.select()
		.from(paymentCards)
		.where(eq(paymentCards.userId, userId))
		.orderBy(desc(paymentCards.isDefault), desc(paymentCards.createdAt));
}

export async function listTransactionsForUser(userId: string, limit = 10) {
	return db
		.select({
			id: paymentTransactions.id,
			title: paymentTransactions.title,
			amount: paymentTransactions.amount,
			currency: paymentTransactions.currency,
			paidAt: paymentTransactions.paidAt,
			cardBrand: paymentCards.brand,
			cardLast4: paymentCards.last4
		})
		.from(paymentTransactions)
		.leftJoin(paymentCards, eq(paymentTransactions.cardId, paymentCards.id))
		.where(eq(paymentTransactions.userId, userId))
		.orderBy(desc(paymentTransactions.paidAt))
		.limit(limit);
}

export type AddCardResult =
	| { ok: true; id: string }
	| { ok: false; error: 'invalid' };

export async function addCardForUser(
	userId: string,
	input: { brand: string; last4: string; expires: string; makeDefault?: boolean }
): Promise<AddCardResult> {
	const brand = input.brand.toLowerCase();
	const last4 = input.last4.trim();
	const expires = input.expires.trim();

	if (!isBrand(brand)) return { ok: false, error: 'invalid' };
	if (!/^\d{4}$/.test(last4)) return { ok: false, error: 'invalid' };
	if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expires)) return { ok: false, error: 'invalid' };

	return db.transaction(async (tx) => {
		const [existing] = await tx
			.select({ id: paymentCards.id })
			.from(paymentCards)
			.where(eq(paymentCards.userId, userId))
			.limit(1);

		const makeDefault = input.makeDefault ?? !existing;

		if (makeDefault) {
			await tx
				.update(paymentCards)
				.set({ isDefault: false })
				.where(eq(paymentCards.userId, userId));
		}

		const [row] = await tx
			.insert(paymentCards)
			.values({ userId, brand, last4, expires, isDefault: makeDefault })
			.returning({ id: paymentCards.id });

		return { ok: true as const, id: row.id };
	});
}

export async function setDefaultCard(userId: string, cardId: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.update(paymentCards)
			.set({ isDefault: false })
			.where(eq(paymentCards.userId, userId));
		await tx
			.update(paymentCards)
			.set({ isDefault: true })
			.where(and(eq(paymentCards.id, cardId), eq(paymentCards.userId, userId)));
	});
}

export async function deleteCard(userId: string, cardId: string): Promise<void> {
	await db.transaction(async (tx) => {
		const [card] = await tx
			.select({ id: paymentCards.id, isDefault: paymentCards.isDefault })
			.from(paymentCards)
			.where(and(eq(paymentCards.id, cardId), eq(paymentCards.userId, userId)))
			.limit(1);

		if (!card) return;

		await tx.delete(paymentCards).where(eq(paymentCards.id, cardId));

		if (card.isDefault) {
			// promote the most recent surviving card to default
			await tx.execute(sql`
				update payment_cards
				set is_default = true
				where id = (
					select id from payment_cards
					where user_id = ${userId}
					order by created_at desc
					limit 1
				)
			`);
		}
	});
}

export function formatCardNumber(last4: string): string {
	return `•••• •••• •••• ${last4}`;
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
	const value = typeof amount === 'string' ? parseFloat(amount) : amount;
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}
