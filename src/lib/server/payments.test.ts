import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { paymentCards } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeCard, makeTransaction, makeUser } from '../../test/factories.ts';
import {
	addCardForUser,
	deleteCard,
	formatCardNumber,
	formatCurrency,
	listCardsForUser,
	listTransactionsForUser,
	setDefaultCard
} from './payments.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const at = (iso: string) => new Date(iso);

async function defaults(userId: string) {
	const rows = await db.select().from(paymentCards).where(eq(paymentCards.userId, userId));
	return rows.filter((r) => r.isDefault).map((r) => r.id);
}

describe('formatters', () => {
	it('masks card numbers', () => {
		expect(formatCardNumber('4242')).toBe('•••• •••• •••• 4242');
	});
	it('formats numbers and numeric strings as currency', () => {
		expect(formatCurrency(150)).toBe('$150.00');
		expect(formatCurrency('12.5')).toBe('$12.50');
		expect(formatCurrency(10, 'EUR')).toBe('€10.00');
	});
});

describe('listCardsForUser', () => {
	it('lists default first, then newest, scoped to the user', async () => {
		const u = await makeUser();
		const other = await makeUser();
		const old = await makeCard(u.id, { createdAt: at('2026-01-01') });
		const def = await makeCard(u.id, { isDefault: true, createdAt: at('2025-01-01') });
		const newest = await makeCard(u.id, { createdAt: at('2026-05-01') });
		await makeCard(other.id);
		expect((await listCardsForUser(u.id)).map((c) => c.id)).toEqual([def.id, newest.id, old.id]);
	});
});

describe('listTransactionsForUser', () => {
	it('joins card details, orders newest first and limits', async () => {
		const u = await makeUser();
		const card = await makeCard(u.id, { brand: 'mastercard', last4: '5555' });
		await makeTransaction(u.id, { title: 'Old', cardId: card.id, paidAt: at('2026-01-01') });
		await makeTransaction(u.id, { title: 'New', paidAt: at('2026-03-01') });
		await makeTransaction((await makeUser()).id, { title: 'Other' });

		const rows = await listTransactionsForUser(u.id);
		expect(rows.map((r) => r.title)).toEqual(['New', 'Old']);
		expect(rows[0]).toMatchObject({ cardBrand: null, cardLast4: null, currency: 'USD', amount: '150.00' });
		expect(rows[1]).toMatchObject({ cardBrand: 'mastercard', cardLast4: '5555' });
		expect(await listTransactionsForUser(u.id, 1)).toHaveLength(1);
	});
});

describe('addCardForUser', () => {
	it('rejects invalid brand, last4 and expiry', async () => {
		const u = await makeUser();
		const good = { brand: 'visa', last4: '4242', expires: '12/30' };
		expect(await addCardForUser(u.id, { ...good, brand: 'amex' })).toEqual({ ok: false, error: 'invalid' });
		expect(await addCardForUser(u.id, { ...good, last4: '42a2' })).toEqual({ ok: false, error: 'invalid' });
		expect(await addCardForUser(u.id, { ...good, last4: '424' })).toEqual({ ok: false, error: 'invalid' });
		expect(await addCardForUser(u.id, { ...good, expires: '13/30' })).toEqual({ ok: false, error: 'invalid' });
		expect(await addCardForUser(u.id, { ...good, expires: '1/30' })).toEqual({ ok: false, error: 'invalid' });
		expect(await listCardsForUser(u.id)).toHaveLength(0);
	});

	it('makes the first card default and later ones not, normalising input', async () => {
		const u = await makeUser();
		const first = await addCardForUser(u.id, { brand: 'VISA', last4: ' 4242 ', expires: ' 01/29 ' });
		expect(first.ok).toBe(true);
		const second = await addCardForUser(u.id, { brand: 'Mastercard', last4: '5555', expires: '12/30' });
		const cards = await listCardsForUser(u.id);
		expect(cards).toHaveLength(2);
		const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
		if (!first.ok || !second.ok) throw new Error('expected ok');
		expect(byId[first.id]).toMatchObject({ brand: 'visa', last4: '4242', expires: '01/29', isDefault: true });
		expect(byId[second.id]).toMatchObject({ brand: 'mastercard', isDefault: false });
	});

	it('makeDefault=true clears the previous default; makeDefault=false on first card', async () => {
		const u = await makeUser();
		const other = await makeUser();
		const otherDefault = await makeCard(other.id, { isDefault: true });

		const a = await addCardForUser(u.id, { brand: 'visa', last4: '1111', expires: '01/30', makeDefault: false });
		if (!a.ok) throw new Error('expected ok');
		expect(await defaults(u.id)).toEqual([]);

		const b = await addCardForUser(u.id, { brand: 'visa', last4: '2222', expires: '01/30', makeDefault: true });
		if (!b.ok) throw new Error('expected ok');
		expect(await defaults(u.id)).toEqual([b.id]);

		const c = await addCardForUser(u.id, { brand: 'visa', last4: '3333', expires: '01/30', makeDefault: true });
		if (!c.ok) throw new Error('expected ok');
		expect(await defaults(u.id)).toEqual([c.id]);
		expect(await defaults(other.id)).toEqual([otherDefault.id]);
	});
});

describe('setDefaultCard', () => {
	it('moves the default flag to the chosen card', async () => {
		const u = await makeUser();
		const a = await makeCard(u.id, { isDefault: true });
		const b = await makeCard(u.id);
		await setDefaultCard(u.id, b.id);
		expect(await defaults(u.id)).toEqual([b.id]);
		expect(a.isDefault).toBe(true);
	});

	it("ignores another user's card and keeps both users' defaults", async () => {
		const u = await makeUser();
		const other = await makeUser();
		const mine = await makeCard(u.id, { isDefault: true });
		const theirs = await makeCard(other.id, { isDefault: true });
		await setDefaultCard(u.id, theirs.id);
		expect(await defaults(other.id)).toEqual([theirs.id]);
		expect(await defaults(u.id)).toEqual([mine.id]);
	});

	it.each([
		['an unknown UUID', '00000000-0000-4000-8000-000000000000'],
		['a non-UUID id', 'not-a-uuid']
	])('keeps the current default for %s', async (_c, id) => {
		const u = await makeUser();
		const mine = await makeCard(u.id, { isDefault: true });
		await setDefaultCard(u.id, id);
		expect(await defaults(u.id)).toEqual([mine.id]);
	});
});

describe('deleteCard', () => {
	it('deleting the default promotes the newest remaining card', async () => {
		const u = await makeUser();
		const def = await makeCard(u.id, { isDefault: true, createdAt: at('2026-06-01') });
		const older = await makeCard(u.id, { createdAt: at('2026-01-01') });
		const newer = await makeCard(u.id, { createdAt: at('2026-03-01') });
		await deleteCard(u.id, def.id);
		const remaining = await listCardsForUser(u.id);
		expect(remaining.map((c) => c.id)).toEqual([newer.id, older.id]);
		expect(await defaults(u.id)).toEqual([newer.id]);
	});

	it('promotion is scoped to the same user', async () => {
		const u = await makeUser();
		const other = await makeUser();
		const def = await makeCard(u.id, { isDefault: true });
		const theirs = await makeCard(other.id, { createdAt: at('2030-01-01') });
		await deleteCard(u.id, def.id);
		expect(await listCardsForUser(u.id)).toHaveLength(0);
		const [row] = await db.select().from(paymentCards).where(eq(paymentCards.id, theirs.id));
		expect(row.isDefault).toBe(false);
	});

	it('deleting a non-default card leaves the default alone', async () => {
		const u = await makeUser();
		const def = await makeCard(u.id, { isDefault: true });
		const other = await makeCard(u.id, { createdAt: at('2030-01-01') });
		await deleteCard(u.id, other.id);
		expect(await defaults(u.id)).toEqual([def.id]);
	});

	it("is a no-op for another user's card or an unknown id", async () => {
		const u = await makeUser();
		const other = await makeUser();
		const theirs = await makeCard(other.id, { isDefault: true });
		await deleteCard(u.id, theirs.id);
		await deleteCard(u.id, '00000000-0000-0000-0000-000000000000');
		await deleteCard(u.id, 'not-a-uuid');
		expect(await listCardsForUser(other.id)).toHaveLength(1);
	});
});
