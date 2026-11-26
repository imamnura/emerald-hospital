import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { setPage } from '#test/mocks/app-state.svelte.ts';
import Pagination from './Pagination.svelte';

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
