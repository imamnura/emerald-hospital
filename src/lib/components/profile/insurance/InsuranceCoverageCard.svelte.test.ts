import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import InsuranceCoverageCard from './InsuranceCoverageCard.svelte';

describe('InsuranceCoverageCard', () => {
	it('renders all insurance fields', () => {
		render(InsuranceCoverageCard, {
			insurance: {
				id: 'i1',
				providerName: 'BlueCare',
				planName: 'Gold Plan',
				memberName: 'Jane Doe',
				memberId: 'M-123',
				groupNo: 'G-9',
				planType: 'PPO',
				coveragePeriod: '2024',
				coverageStart: null,
				coverageEnd: null,
				status: 'ACTIVE',
				costs: [],
				providerPhone: '123'
			}
		});
		for (const t of ['BlueCare', 'Gold Plan', 'Jane Doe', 'M-123', 'G-9', 'PPO']) {
			expect(screen.getByText(t)).toBeInTheDocument();
		}
	});
});
