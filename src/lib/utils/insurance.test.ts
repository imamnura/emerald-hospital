import { describe, expect, it } from 'vitest';
import type { InsuranceProfileView } from '#lib/utils/insurance.ts';

describe('insurance types', () => {
	it('module is type-only and importable', async () => {
		const mod = await import('#lib/utils/insurance.ts');
		const view: InsuranceProfileView = {
			id: null,
			providerName: 'BPJS',
			planName: 'Gold',
			memberName: 'A',
			memberId: 'M',
			groupNo: 'G',
			planType: 'PPO',
			coveragePeriod: '',
			coverageStart: null,
			coverageEnd: null,
			status: 'ACTIVE',
			costs: [],
			providerPhone: ''
		};
		expect(mod).toBeTypeOf('object');
		expect(view.status).toBe('ACTIVE');
	});
});
