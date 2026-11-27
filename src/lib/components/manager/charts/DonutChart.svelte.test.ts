import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DonutChart from './DonutChart.svelte';

describe('DonutChart', () => {
	const data = [
		{ key: 'p', label: 'Pending', value: 1, color: 'orange' },
		{ key: 'c', label: 'Confirmed', value: 3, color: 'green' },
		{ key: 'x', label: 'Cancelled', value: 0, color: 'red' }
	];

	it('renders no arcs when total is zero', () => {
		const { container } = render(DonutChart, {
			data: [{ key: 'a', label: 'A', value: 0, color: 'red' }]
		});
		expect(container.querySelectorAll('path')).toHaveLength(0);
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getAllByText('0').length).toBeGreaterThan(0);
	});

	it('renders arcs for non-zero segments and legend for all', () => {
		const { container } = render(DonutChart, { data, centerLabel: 'All' });
		const paths = container.querySelectorAll('path');
		expect(paths).toHaveLength(2);
		// 3/4 sweep > 180 → large-arc flag
		expect(paths[1].getAttribute('d')).toContain(' 0 1 1 ');
		expect(paths[0].getAttribute('d')).toContain(' 0 0 1 ');
		expect(screen.getByText('All')).toBeInTheDocument();
		expect(screen.getByText('4')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
	});

	it('highlights hovered segment from arc and legend', async () => {
		const { container } = render(DonutChart, { data });
		const paths = container.querySelectorAll('path');
		await fireEvent.pointerEnter(paths[1]);
		expect(screen.getAllByText('Confirmed')).toHaveLength(2);
		expect(screen.getByText('75%')).toBeInTheDocument();
		expect(paths[0].getAttribute('style')).toContain('opacity: 0.35');
		expect(paths[1].getAttribute('style')).toContain('opacity: 1');
		await fireEvent.pointerLeave(paths[1]);
		expect(screen.queryByText('75%')).toBeNull();
		expect(screen.getByText('Total')).toBeInTheDocument();

		const items = screen.getAllByRole('listitem');
		await fireEvent.pointerEnter(items[0]);
		expect(items[0]).toHaveClass('bg-surface-container');
		expect(screen.getByText('25%')).toBeInTheDocument();
		await fireEvent.pointerLeave(items[0]);
		expect(items[0]).not.toHaveClass('bg-surface-container');

		// hovering a zero-value legend row has no matching arc → shows totals
		await fireEvent.pointerEnter(items[2]);
		expect(screen.getByText('Total')).toBeInTheDocument();
	});

	it('caps a single full segment just below 360 degrees', () => {
		const { container } = render(DonutChart, {
			data: [{ key: 'only', label: 'Only', value: 5, color: 'blue' }]
		});
		expect(container.querySelectorAll('path')).toHaveLength(1);
		expect(container.querySelector('path')!.getAttribute('d')).toContain(' 0 1 1 ');
	});
});

describe('DonutChart with nullish props', () => {
	it('renders when colors are null', () => {
		const { container } = render(DonutChart, {
			data: [{ key: 'a', label: 'A', value: 2, color: null as unknown as string }]
		});
		expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 180 180');
		expect(container.querySelector<HTMLElement>('li span span')!.style.backgroundColor).toBe('');
	});
});
