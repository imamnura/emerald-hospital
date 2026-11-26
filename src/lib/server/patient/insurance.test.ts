import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { insuranceProfiles } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeInsurance, makeUser } from '../../../test/factories.ts';
import { getInsuranceForUser, upsertInsurance } from './insurance.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('getInsuranceForUser', () => {
	it('returns an inactive placeholder when the user has no profile', async () => {
		const user = await makeUser();
		expect(await getInsuranceForUser(user.id, 'Jane Doe')).toEqual({
			id: null,
			providerName: '—',
			planName: 'No active plan',
			memberName: 'Jane Doe',
			memberId: '—',
			groupNo: '—',
			planType: '—',
			coveragePeriod: '—',
			coverageStart: null,
			coverageEnd: null,
			status: 'INACTIVE',
			costs: [],
			providerPhone: '+18005551234'
		});
	});

	it('maps a sparse profile with dash fallbacks and the default phone', async () => {
		const user = await makeUser();
		const row = await makeInsurance(user.id);
		const view = await getInsuranceForUser(user.id, 'Jane');
		expect(view).toEqual({
			id: row.id,
			providerName: 'BPJS',
			planName: 'Gold',
			memberName: 'Jane',
			memberId: 'M-1',
			groupNo: '—',
			planType: '—',
			coveragePeriod: 'Jan 1, 2026 - Dec 31, 2026',
			coverageStart: '2026-01-01',
			coverageEnd: '2026-12-31',
			status: 'ACTIVE',
			costs: [
				{ id: 'pcp', label: 'PCP Visit', amount: '—' },
				{ id: 'specialist', label: 'Specialist', amount: '—' },
				{ id: 'emergency', label: 'Emergency', amount: '—' },
				{ id: 'rx', label: 'Rx Deductible', amount: '—' }
			],
			providerPhone: '+18005551234'
		});
	});

	it('maps a full profile with formatted costs', async () => {
		const user = await makeUser();
		await makeInsurance(user.id, {
			groupNo: 'G-9',
			planType: 'PPO',
			status: 'INACTIVE',
			costPcp: '25.00',
			costSpecialist: '49.60',
			costEmergency: '150.00',
			costRx: '0.00',
			providerPhone: '+621234',
			coverageStart: '2025-03-15',
			coverageEnd: '2026-03-14'
		});
		const view = await getInsuranceForUser(user.id, 'Jane');
		expect(view).toMatchObject({
			groupNo: 'G-9',
			planType: 'PPO',
			status: 'INACTIVE',
			coveragePeriod: 'Mar 15, 2025 - Mar 14, 2026',
			providerPhone: '+621234'
		});
		expect(view.costs.map((c) => c.amount)).toEqual(['$25', '$50', '$150', '$0']);
	});

	it('only reads the requested user', async () => {
		const a = await makeUser();
		const b = await makeUser();
		await makeInsurance(a.id);
		expect((await getInsuranceForUser(b.id, 'B')).id).toBeNull();
	});
});

describe('upsertInsurance', () => {
	const base = {
		providerName: 'Allianz',
		planName: 'Silver',
		memberId: 'X-1',
		coverageStart: '2026-01-01',
		coverageEnd: '2026-12-31'
	};

	it('inserts a new profile with defaults', async () => {
		const user = await makeUser();
		const id = await upsertInsurance(user.id, base);
		const [row] = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.id, id));
		expect(row).toMatchObject({
			userId: user.id,
			providerName: 'Allianz',
			status: 'ACTIVE',
			groupNo: null,
			planType: null,
			costPcp: null,
			costSpecialist: null,
			costEmergency: null,
			costRx: null,
			providerPhone: null
		});
	});

	it('upsertInsurance updates the existing row instead of inserting a second', async () => {
		const user = await makeUser();
		const first = await upsertInsurance(user.id, base);
		const second = await upsertInsurance(user.id, { ...base, providerName: 'AXA' });
		expect(second).toBe(first);
		const rows = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.userId, user.id));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ id: first, providerName: 'AXA' });
	});

	it('updates the existing profile in place, keeping the same id', async () => {
		const user = await makeUser();
		const id = await upsertInsurance(user.id, {
			...base,
			groupNo: 'G',
			planType: 'HMO',
			status: 'INACTIVE',
			costPcp: '10',
			costSpecialist: '20',
			costEmergency: '30',
			costRx: '40',
			providerPhone: '+1'
		});
		const [first] = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.id, id));
		expect(first).toMatchObject({ groupNo: 'G', status: 'INACTIVE', costRx: '40.00', providerPhone: '+1' });

		const again = await upsertInsurance(user.id, { ...base, planName: 'Platinum' });
		expect(again).toBe(id);
		const rows = await db.select().from(insuranceProfiles).where(eq(insuranceProfiles.userId, user.id));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			planName: 'Platinum',
			status: 'ACTIVE',
			groupNo: null,
			costRx: null,
			providerPhone: null
		});
	});
});
