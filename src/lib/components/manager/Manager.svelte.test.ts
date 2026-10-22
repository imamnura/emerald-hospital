import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import ConfirmDialog from './ConfirmDialog.svelte';
import EmptyState from './EmptyState.svelte';
import Modal from './Modal.svelte';
import PageHeader from './PageHeader.svelte';
import Pagination from './Pagination.svelte';

describe('EmptyState', () => {
	it('renders default icon without description', () => {
		const { container } = render(EmptyState, { title: 'Nothing here' });
		expect(screen.getByText('Nothing here')).toBeInTheDocument();
		expect(container.querySelector('.lucide-inbox')).toBeInTheDocument();
		expect(container.querySelectorAll('p')).toHaveLength(1);
	});

	it('renders custom icon and description', () => {
		const { container } = render(EmptyState, {
			title: 'No bookings',
			description: 'Try another filter',
			icon: snip('<i data-testid="custom"></i>')
		});
		expect(screen.getByTestId('custom')).toBeInTheDocument();
		expect(screen.getByText('Try another filter')).toBeInTheDocument();
		expect(container.querySelector('.lucide-inbox')).toBeNull();
	});
});

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

describe('Modal', () => {
	const children = snip('<p>modal body</p>');

	it('renders nothing when closed', () => {
		render(Modal, { open: false, title: 'T', children });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders content, description, footer and size', () => {
		render(Modal, {
			open: true,
			title: 'Edit',
			description: 'Update doctor',
			size: 'lg',
			children,
			footer: snip('<button>Save</button>')
		});
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
		expect(dialog).toHaveClass('max-w-2xl');
		expect(screen.getByRole('heading', { name: 'Edit' })).toBeInTheDocument();
		expect(screen.getByText('Update doctor')).toBeInTheDocument();
		expect(screen.getByText('modal body')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
	});

	it('defaults to md without footer or description', () => {
		const { container } = render(Modal, { open: true, title: 'T', children });
		expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');
		expect(container.querySelector('footer')).toBeNull();
		expect(screen.getByRole('dialog').querySelectorAll('header p')).toHaveLength(0);
	});

	it('closes via close button and calls onClose', async () => {
		const onClose = vi.fn();
		render(Modal, { open: true, title: 'T', size: 'sm', children, onClose });
		expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onClose).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('closes on backdrop click without onClose', async () => {
		render(Modal, { open: true, title: 'T', children });
		await fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});

	it('closes on Escape, ignores other keys and Escape while closed', async () => {
		const onClose = vi.fn();
		render(Modal, { open: true, title: 'T', children, onClose });
		await fireEvent.keyDown(window, { key: 'Enter' });
		expect(onClose).not.toHaveBeenCalled();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});

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

describe('Pagination', () => {
	it('shows empty label and no nav for zero rows', () => {
		render(Pagination, { page: 1, pageSize: 10, total: 0, label: 'doctors' });
		expect(screen.getByText('No doctors')).toBeInTheDocument();
		expect(screen.queryByRole('navigation')).toBeNull();
	});

	it('shows range without nav for a single page', () => {
		const { container } = render(Pagination, { page: 1, pageSize: 10, total: 5 });
		expect(container.textContent).toMatch(/Showing\s*1–5\s*of\s*5\s*rows/);
		expect(screen.queryByRole('navigation')).toBeNull();
	});

	it('renders all pages when 7 or fewer and builds hrefs from page.url', () => {
		setPage({ url: '/manager/bookings?status=pending&page=2' });
		render(Pagination, { page: 2, pageSize: 10, total: 30 });
		const nav = screen.getByRole('navigation', { name: 'Pagination' });
		expect(nav).toBeInTheDocument();
		expect(screen.getByLabelText('Previous page')).toHaveAttribute('href', '?status=pending');
		expect(screen.getByLabelText('Previous page')).toHaveAttribute('aria-disabled', 'false');
		expect(screen.getByLabelText('Next page')).toHaveAttribute('href', '?status=pending&page=3');
		expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute('aria-current');
		expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('href', '?status=pending&page=3');
	});

	it('falls back to pathname for page 1 without other params and disables prev', () => {
		setPage({ url: '/manager/doctors?page=2' });
		render(Pagination, { page: 1, pageSize: 10, total: 20 });
		const prev = screen.getByLabelText('Previous page');
		expect(prev).toHaveAttribute('href', '/manager/doctors');
		expect(prev).toHaveAttribute('aria-disabled', 'true');
		expect(prev).toHaveClass('pointer-events-none');
		expect(screen.getByLabelText('Next page')).toHaveAttribute('href', '?page=2');
	});

	it('disables next on last page', () => {
		setPage({ url: '/m' });
		render(Pagination, { page: 2, pageSize: 10, total: 20 });
		const next = screen.getByLabelText('Next page');
		expect(next).toHaveAttribute('aria-disabled', 'true');
		expect(next).toHaveAttribute('href', '?page=2');
	});

	it('renders compact window with gaps for many pages', () => {
		setPage({ url: '/m' });
		const { container } = render(Pagination, { page: 10, pageSize: 10, total: 200 });
		const labels = [...screen.getByRole('navigation').children].map((el) =>
			el.textContent?.trim()
		);
		expect(labels).toEqual(['', '1', '…', '9', '10', '11', '…', '20', '']);
		expect(container.textContent).toMatch(/Showing\s*91–100\s*of\s*200/);
	});

	it('renders window at the start without leading gap', () => {
		setPage({ url: '/m' });
		render(Pagination, { page: 1, pageSize: 10, total: 100 });
		const labels = [...screen.getByRole('navigation').children].map((el) =>
			el.textContent?.trim()
		);
		expect(labels).toEqual(['', '1', '2', '…', '10', '']);
	});
});

describe('nullish / unexpected props', () => {
	it('Modal with unknown size has no max-width class', () => {
		render(Modal, {
			open: true,
			title: 'T',
			size: 'xl' as never,
			children: snip('<p>x</p>')
		});
		expect(screen.getByRole('dialog').className).not.toMatch(/max-w-(sm|lg|2xl)/);
	});

	it('Pagination with a null label renders empty label text', () => {
		const { container, unmount } = render(Pagination, {
			page: 1,
			pageSize: 10,
			total: 0,
			label: null as unknown as string
		});
		expect(container.textContent?.trim()).toBe('No');
		unmount();
		const second = render(Pagination, {
			page: 1,
			pageSize: 10,
			total: 3,
			label: null as unknown as string
		});
		expect(second.container.textContent).toMatch(/of\s*3\s*$/);
	});
});
