import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog.svelte';

describe('ConfirmDialog', () => {
	it('renders defaults and confirms', async () => {
		const onConfirm = vi.fn();
		render(ConfirmDialog, { open: true, message: 'Delete it?', onConfirm });
		expect(screen.getByRole('heading', { name: 'Are you sure?' })).toBeInTheDocument();
		expect(screen.getByText('Delete it?')).toBeInTheDocument();
		const confirm = screen.getByRole('button', { name: 'Confirm' });
		expect(confirm).toHaveClass('bg-primary');
		await fireEvent.click(confirm);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it('renders danger variant with custom labels and cancels', async () => {
		const onCancel = vi.fn();
		const { container } = render(ConfirmDialog, {
			open: true,
			title: 'Remove doctor',
			message: 'Gone forever',
			confirmLabel: 'Delete',
			cancelLabel: 'Keep',
			danger: true,
			onConfirm: vi.fn(),
			onCancel
		});
		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-error');
		expect(container.ownerDocument.querySelector('.text-error')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
		expect(onCancel).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('cancel without onCancel just closes', async () => {
		render(ConfirmDialog, { open: true, message: 'm', onConfirm: vi.fn() });
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('shows loading state with disabled buttons', () => {
		render(ConfirmDialog, { open: true, message: 'm', loading: true, onConfirm: vi.fn() });
		expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
	});

	it('is hidden when closed', () => {
		render(ConfirmDialog, { message: 'm', onConfirm: vi.fn() } as never);
		expect(screen.queryByRole('dialog')).toBeNull();
	});
});
