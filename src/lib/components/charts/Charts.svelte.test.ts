import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AreaChart from './AreaChart.svelte';
import BarChart from './BarChart.svelte';
import DonutChart from './DonutChart.svelte';

function mockRect(el: Element) {
	el.getBoundingClientRect = () =>
		({ left: 0, top: 0, width: 800, height: 220, right: 800, bottom: 220, x: 0, y: 0 }) as DOMRect;
}

const days = (values: number[]) =>
	values.map((total, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, total }));

describe('AreaChart', () => {
	it('renders only the grid for empty data', () => {
		const { container } = render(AreaChart, { data: [] });
		const svg = screen.getByRole('img', { name: 'Bookings over time' });
		expect(svg).toHaveAttribute('viewBox', '0 0 800 220');
		expect(container.querySelectorAll('path')).toHaveLength(0);
		// yMax falls back to 1 → ticks 0 and 1
		expect([...container.querySelectorAll('text')].map((t) => t.textContent?.trim())).toEqual([
			'0',
			'1'
		]);
		mockRect(svg);
		fireEvent.pointerMove(svg, { clientX: 100 });
		expect(container.querySelector('circle')).toBeNull();
	});

	it('renders a single point with one x label', () => {
		const { container } = render(AreaChart, { data: days([3]) });
		expect(container.querySelectorAll('path')).toHaveLength(2);
		expect(container.querySelector('path[stroke]')?.getAttribute('d')).toMatch(/^M 28\.00/);
		expect(screen.getByText('Jan 1')).toBeInTheDocument();
	});

	it('renders line, area, x labels and tooltip on hover', async () => {
		const data = days([1, 5, 2, 8, 3, 0, 4]);
		const { container } = render(AreaChart, { data, height: 300 });
		const svg = screen.getByRole('img');
		expect(svg).toHaveAttribute('viewBox', '0 0 800 300');
		expect(container.querySelectorAll('path')).toHaveLength(2);
		// 5 x-axis labels picked out of 7 points
		expect(screen.getByText('Jan 1')).toBeInTheDocument();
		expect(screen.getByText('Jan 7')).toBeInTheDocument();

		mockRect(svg);
		await fireEvent.pointerMove(svg, { clientX: 0 });
		expect(container.querySelector('circle')).toBeInTheDocument();
		expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
		expect(screen.getByText('1 booking')).toBeInTheDocument();

		await fireEvent.pointerMove(svg, { clientX: 800 });
		expect(screen.getByText('4 bookings')).toBeInTheDocument();

		await fireEvent.pointerLeave(svg);
		expect(container.querySelector('circle')).toBeNull();
	});

	it('uses larger tick steps for big values and can hide the x axis', () => {
		const { container } = render(AreaChart, { data: days([7, 10]), showXAxis: false });
		expect(screen.queryByText('Jan 1')).toBeNull();
		const ticks = [...container.querySelectorAll('text')].map((t) => t.textContent?.trim());
		expect(ticks).toEqual(['0', '2', '4', '6', '8', '10']);
	});

	it('appends the max as final tick when steps do not land on it', () => {
		const { container } = render(AreaChart, { data: days([13]) });
		const ticks = [...container.querySelectorAll('text')]
			.map((t) => t.textContent?.trim())
			.filter((t) => /^\d+$/.test(t ?? ''));
		expect(ticks).toEqual(['0', '4', '8', '12', '13']);
	});
});

describe('BarChart', () => {
	it('shows empty state', () => {
		render(BarChart, { data: [] });
		expect(screen.getByText('No data for the selected filters.')).toBeInTheDocument();
	});

	it('renders rows scaled to max, value label, sublabel and maxRows', () => {
		const { container } = render(BarChart, {
			data: [
				{ key: 'a', label: 'Alpha', sublabel: 'first', value: 10 },
				{ key: 'b', label: 'Beta', value: 5 },
				{ key: 'c', label: 'Gamma', value: 1 }
			],
			valueLabel: 'visits',
			maxRows: 2
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
		const { container } = render(DonutChart, { data, centerLabel: 'All', size: 200, thickness: 20 });
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
	it('renders when size and colors are null', () => {
		const { container } = render(DonutChart, {
			size: null as unknown as number,
			data: [{ key: 'a', label: 'A', value: 2, color: null as unknown as string }]
		});
		expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0  ');
		expect(container.querySelector<HTMLElement>('li span span')!.style.backgroundColor).toBe('');
	});
});
