import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import CostDetailCard from './CostDetailCard.svelte';
import CoveragePeriodCard from './CoveragePeriodCard.svelte';
import InsuranceCoverageCard from './InsuranceCoverageCard.svelte';

describe('CostDetailCard', () => {
	it('renders label, amount and icon', () => {
		render(CostDetailCard, {
			label: 'Copay',
			amount: '$20',
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByText('Copay')).toBeInTheDocument();
		expect(screen.getByText('$20')).toBeInTheDocument();
		expect(screen.getByTestId('ic')).toBeInTheDocument();
	});
});

describe('CoveragePeriodCard', () => {
	it('renders period and status', () => {
		render(CoveragePeriodCard, { period: 'Jan 2024 - Dec 2024', status: 'ACTIVE' });
		expect(screen.getByText('Coverage Period')).toBeInTheDocument();
		expect(screen.getByText('Jan 2024 - Dec 2024')).toBeInTheDocument();
		expect(screen.getByText('ACTIVE')).toBeInTheDocument();
	});
});

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
