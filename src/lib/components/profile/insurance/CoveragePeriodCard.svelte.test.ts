import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CoveragePeriodCard from './CoveragePeriodCard.svelte';

describe('CoveragePeriodCard', () => {
	it('renders period and status', () => {
		render(CoveragePeriodCard, { period: 'Jan 2024 - Dec 2024', status: 'ACTIVE' });
		expect(screen.getByText('Coverage Period')).toBeInTheDocument();
		expect(screen.getByText('Jan 2024 - Dec 2024')).toBeInTheDocument();
		expect(screen.getByText('ACTIVE')).toBeInTheDocument();
	});
});
