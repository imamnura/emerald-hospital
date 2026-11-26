import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AreaChart from './AreaChart.svelte';

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
		const { container } = render(AreaChart, { data });
		const svg = screen.getByRole('img');
		expect(svg).toHaveAttribute('viewBox', '0 0 800 220');
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

	it('uses larger tick steps for big values', () => {
		const { container } = render(AreaChart, { data: days([7, 10]) });
		const ticks = [...container.querySelectorAll('text')]
			.map((t) => t.textContent?.trim())
			.filter((t) => /^\d+$/.test(t ?? ''));
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
