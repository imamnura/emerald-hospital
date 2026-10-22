import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '#lib/stores/toast.svelte.ts';
import Toaster from './Toaster.svelte';

afterEach(() => {
	toast.clear();
});

describe('Toaster', () => {
	it('renders an empty live region', () => {
		const { container } = render(Toaster);
		const region = container.querySelector('[aria-live="polite"]');
		expect(region).toBeInTheDocument();
		expect(region?.children).toHaveLength(0);
	});

	it('renders each toast kind with its role and icon', () => {
		const { container } = render(Toaster);
		flushSync(() => {
			toast.success('Saved', 0);
			toast.error('Failed', 0);
			toast.warning('Careful', 0);
			toast.info('FYI', 0);
		});
		expect(screen.getByRole('alert')).toHaveTextContent('Failed');
		expect(screen.getAllByRole('status')).toHaveLength(3);
		expect(container.querySelector('.lucide-circle-check')).toBeInTheDocument();
		expect(container.querySelector('.lucide-circle-alert')).toBeInTheDocument();
		expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument();
		expect(container.querySelector('.lucide-info')).toBeInTheDocument();
		expect(screen.getByText('Saved').closest('[role="status"]')).toHaveClass('border-primary/30');
		expect(screen.getByText('Careful').closest('[role="status"]')).toHaveClass('border-amber-200');
	});

	it('dismisses a toast via its button', async () => {
		render(Toaster);
		flushSync(() => toast.info('Hello', 0));
		expect(screen.getByText('Hello')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
		expect(toast.toasts).toHaveLength(0);
		await vi.waitFor(() => expect(screen.queryByText('Hello')).toBeNull());
	});
});
