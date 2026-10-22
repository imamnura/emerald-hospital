import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions, update } from '../../../../test/mocks/app-forms.ts';
import { mockLocationHref } from '../../../../test/helpers-pages-public.ts';

const emptyInsurance = {
	id: null,
	providerName: '—',
	planName: 'No active plan',
	memberName: 'Jane',
	memberId: '—',
	groupNo: '—',
	planType: '—',
	coveragePeriod: '—',
	coverageStart: null,
	coverageEnd: null,
	status: 'INACTIVE',
	costs: [],
	providerPhone: '+18005551234'
};

const fullInsurance = {
	id: 'ins1',
	providerName: 'BlueCross',
	planName: 'Gold PPO',
	memberName: 'Jane',
	memberId: 'M-1',
	groupNo: 'G-1',
	planType: 'PPO',
	coveragePeriod: 'Jan 1, 2024 - Dec 31, 2024',
	coverageStart: '2024-01-01',
	coverageEnd: '2024-12-31',
	status: 'ACTIVE',
	costs: [
		{ id: 'pcp', label: 'PCP Visit', amount: '$20' },
		{ id: 'specialist', label: 'Specialist', amount: '$40' },
		{ id: 'emergency', label: 'Emergency', amount: '$100' },
		{ id: 'rx', label: 'Rx Deductible', amount: '$10' }
	],
	providerPhone: '+1999'
};

let loc: ReturnType<typeof mockLocationHref>;
beforeEach(() => {
	loc = mockLocationHref();
});
afterEach(() => loc.restore());

function input(name: string) {
	return document.querySelector(`[name="${name}"]`) as HTMLInputElement;
}

describe('insurance page', () => {
	it('empty insurance: add flow with blank defaults, cancel', async () => {
		render(Page, { props: { data: { insurance: emptyInsurance }, form: null } as never });
		expect(screen.getByText('No active plan')).toBeInTheDocument();
		expect(screen.queryByText('PCP Visit')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: /Add Insurance/ }));
		expect(input('providerName').value).toBe('');
		expect(input('planName').value).toBe('');
		expect(input('memberId').value).toBe('');
		expect(input('groupNo').value).toBe('');
		expect(input('planType').value).toBe('');
		expect(input('coverageStart').value).toBe('');
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.getByRole('button', { name: /Add Insurance/ })).toBeInTheDocument();
	});

	it('full insurance: costs, contact provider, update & save', async () => {
		render(Page, { props: { data: { insurance: fullInsurance }, form: null } as never });
		expect(screen.getByText('PCP Visit')).toBeInTheDocument();
		expect(screen.getByText('Rx Deductible')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Contact Provider/ }));
		expect(loc.setHref).toHaveBeenCalledWith('tel:+1999');

		await fireEvent.click(screen.getByRole('button', { name: /Update Insurance/ }));
		expect(input('providerName').value).toBe('BlueCross');
		expect(input('planName').value).toBe('Gold PPO');
		expect(input('memberId').value).toBe('M-1');
		expect(input('groupNo').value).toBe('G-1');
		expect(input('planType').value).toBe('PPO');
		expect(input('coverageEnd').value).toBe('2024-12-31');
		await fireEvent.submit(input('providerName').closest('form')!);
		expect(submissions[0].action.search).toBe('?/save');
		expect(update).toHaveBeenCalledWith({ reset: false });
		await waitFor(() => expect(screen.getByRole('button', { name: /Update Insurance/ })).toBeInTheDocument());
	});

	it('editing form re-renders when data changes', async () => {
		const { rerender } = render(Page, {
			props: { data: { insurance: fullInsurance }, form: null } as never
		});
		await fireEvent.click(screen.getByRole('button', { name: /Update Insurance/ }));
		await rerender({
			data: { insurance: { ...fullInsurance, planName: 'Silver' } },
			form: null
		} as never);
		expect(input('planName').value).toBe('Silver');
		expect((document.querySelector('[name="status"]') as HTMLSelectElement).value).toBe('ACTIVE');
	});

	it('existing insurance with dash group/plan type', async () => {
		render(Page, {
			props: {
				data: { insurance: { ...fullInsurance, groupNo: '—', planType: '—' } },
				form: { error: 'Coverage end must be after start.' }
			} as never
		});
		expect(screen.getByText('Coverage end must be after start.')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Update Insurance/ }));
		expect(input('groupNo').value).toBe('');
		expect(input('planType').value).toBe('');
	});
});
