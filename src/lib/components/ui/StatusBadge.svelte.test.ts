import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
	it.each([
		['pending', 'Pending', 'bg-amber-100', 'bg-amber-500'],
		['confirmed', 'Confirmed', 'bg-primary/10', 'bg-primary'],
		['cancelled', 'Cancelled', 'bg-red-50', 'bg-error'],
		['completed', 'Completed', 'bg-surface-container', 'bg-outline']
	] as const)('renders %s', (status, label, color, dot) => {
		const { container } = render(StatusBadge, { status });
		const badge = screen.getByText(label);
		expect(badge).toHaveClass(color);
		expect(container.querySelector('span > span')).toHaveClass(dot);
	});

	it('falls back for unknown status', () => {
		const { container } = render(StatusBadge, { status: 'archived' });
		const badge = screen.getByText('archived');
		expect(badge).toHaveClass('bg-surface-container');
		expect(container.querySelector('span > span')).toHaveClass('bg-outline');
	});
});

describe('StatusBadge with null status', () => {
	it('renders an empty neutral badge', () => {
		const { container } = render(StatusBadge, { status: null as unknown as string });
		expect(container.querySelector('span')?.textContent?.trim()).toBe('');
		expect(container.querySelector('span')).toHaveClass('bg-surface-container');
	});
});
