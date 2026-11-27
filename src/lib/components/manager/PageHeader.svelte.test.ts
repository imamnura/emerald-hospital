import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import PageHeader from './PageHeader.svelte';

describe('PageHeader', () => {
	it('renders title only', () => {
		const { container } = render(PageHeader, { title: 'Doctors' });
		expect(screen.getByRole('heading', { name: 'Doctors' })).toBeInTheDocument();
		expect(container.querySelectorAll('p')).toHaveLength(0);
		expect(container.querySelector('.rounded-full')).toBeNull();
	});

	it('renders count with label, subtitle and actions', () => {
		render(PageHeader, {
			title: 'Bookings',
			subtitle: 'All bookings',
			count: 12,
			countLabel: 'total',
			actions: snip('<button>New</button>')
		});
		expect(screen.getByText('12 total')).toBeInTheDocument();
		expect(screen.getByText('All bookings')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
	});

	it('renders zero count without label', () => {
		render(PageHeader, { title: 'X', count: 0 });
		expect(screen.getByText('0')).toBeInTheDocument();
	});
});

describe('PageHeader add button', () => {
	it('renders the add button and fires onadd', async () => {
		const onadd = vi.fn();
		render(PageHeader, { title: 'Docs', addLabel: 'Add Doc', onadd });
		await fireEvent.click(screen.getByRole('button', { name: 'Add Doc' }));
		expect(onadd).toHaveBeenCalledOnce();
	});
});
