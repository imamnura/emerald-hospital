import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { insuranceProfiles } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeInsurance, makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

const valid = {
	providerName: ' BPJS ',
	planName: 'Gold',
	memberId: 'M-9',
	coverageStart: '2026-01-01',
	coverageEnd: '2026-12-31'
};

describe('profile/insurance load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/insurance'
		});
	});

	it('returns the placeholder or the saved plan', async () => {
		const user = await makeUser({ name: 'Ana' });
		const empty = (await load(ev({ user }))) as { insurance: { id: null; memberName: string } };
		expect(empty.insurance).toMatchObject({ id: null, memberName: 'Ana' });

		await makeInsurance(user.id, { providerName: 'Prudential' });
		const saved = (await load(ev({ user }))) as { insurance: { providerName: string } };
		expect(saved.insurance.providerName).toBe('Prudential');
	});
});

describe('profile/insurance save action', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => actions.save(ev({ form: valid })))).toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('requires the core fields and valid ISO dates', async () => {
		const user = await makeUser();
		for (const patch of [
			{ providerName: '' },
			{ planName: ' ' },
			{ memberId: '' },
			{ coverageStart: '01/01/2026' },
			{ coverageEnd: '' }
		]) {
			expect(await actions.save(ev({ user, form: { ...valid, ...patch } }))).toMatchObject({
				status: 400,
				data: { error: 'Provider, plan, member ID, and coverage dates are required.' }
			});
		}
		expect(await actions.save(ev({ user, form: { other: '1' } }))).toMatchObject({ status: 400 });
	});

	it('rejects an end date before the start', async () => {
		const user = await makeUser();
		expect(
			await actions.save(ev({ user, form: { ...valid, coverageEnd: '2025-12-31' } }))
		).toMatchObject({ status: 400, data: { error: 'Coverage end must be after start.' } });
	});

	it('saves the minimal form with ACTIVE status and null optionals', async () => {
		const user = await makeUser();
		expect(await actions.save(ev({ user, form: valid }))).toEqual({ success: true });
		const [row] = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.userId, user.id));
		expect(row).toMatchObject({
			providerName: 'BPJS',
			status: 'ACTIVE',
			groupNo: null,
			planType: null,
			costPcp: null,
			providerPhone: null
		});
	});

	it('saves every optional field and normalises costs', async () => {
		const user = await makeUser();
		const form = {
			...valid,
			groupNo: 'G-1',
			planType: 'PPO',
			status: 'INACTIVE',
			costPcp: '25',
			costSpecialist: '-5',
			costEmergency: 'abc',
			costRx: '10.5',
			providerPhone: ' 021-555 '
		};
		expect(await actions.save(ev({ user, form }))).toEqual({ success: true });
		const [row] = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.userId, user.id));
		expect(row).toMatchObject({
			groupNo: 'G-1',
			planType: 'PPO',
			status: 'INACTIVE',
			costPcp: '25.00',
			costSpecialist: null,
			costEmergency: null,
			costRx: '10.50',
			providerPhone: '021-555'
		});
	});
});
