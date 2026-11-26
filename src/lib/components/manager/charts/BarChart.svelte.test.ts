import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BarChart from './BarChart.svelte';

describe('BarChart', () => {
	it('shows empty state', () => {
		render(BarChart, { data: [] });
		expect(screen.getByText('No data for the selected filters.')).toBeInTheDocument();
	});

	it('renders rows scaled to max, value label, sublabel and the 8-row cap', () => {
		const { container } = render(BarChart, {
			data: [
				{ key: 'a', label: 'Alpha', sublabel: 'first', value: 10 },
				{ key: 'b', label: 'Beta', value: 5 },
				...Array.from({ length: 6 }, (_, i) => ({ key: `f${i}`, label: `Filler ${i}`, value: 1 })),
				{ key: 'c', label: 'Gamma', value: 1 }
			],
			valueLabel: 'visits'
		});
		expect(screen.queryByText('No data for the selected filters.')).toBeNull();
		expect(screen.getByText('10 visits')).toBeInTheDocument();
		expect(screen.getByText('5 visits')).toBeInTheDocument();
		expect(screen.getByText('first')).toBeInTheDocument();
		expect(screen.queryByText('Gamma')).toBeNull();
		const bars = container.querySelectorAll<HTMLElement>('.bg-primary');
		expect(bars[0].style.width).toBe('100%');
		expect(bars[1].style.width).toBe('50%');
	});

	it('renders values without label and handles all-zero data', () => {
		const { container } = render(BarChart, { data: [{ key: 'z', label: 'Zero', value: 0 }] });
		expect(screen.getByText('0')).toBeInTheDocument();
		expect(container.querySelector<HTMLElement>('.bg-primary')!.style.width).toBe('0%');
	});
});
