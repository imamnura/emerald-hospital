import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setEnhanceResult, submissions } from '#test/mocks/app-forms.ts';
import { goto } from '#test/mocks/app-navigation.ts';
import { setPage } from '#test/mocks/app-state.svelte.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import Page from './+page.svelte';

const bookings = [
	{
		id: 'b1',
		appointmentDate: '2026-10-20',
		appointmentTime: '09:00',
		status: 'pending',
		patientName: 'Pat One',
		doctorName: 'Dr. Alice',
		specialty: 'Cardiology',
		hospital: 'Central Health'
	},
	{
		id: 'b2',
		appointmentDate: '2026-10-21',
		appointmentTime: '10:30',
		status: 'confirmed',
		patientName: 'Pat Two',
		doctorName: 'Dr. Bob',
		specialty: 'Dental',
		hospital: 'East Clinic'
	}
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		bookings,
		total: 2,
		page: 1,
		pageSize: 10,
		query: '',
		statusFilter: '',
		statusCounts: { all: 9, pending: 3, confirmed: 2, cancelled: 1, completed: 3 },
		...overrides
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });
const messages = () => toast.toasts.map((t) => t.message);

beforeEach(() => {
	toast.clear();
	setPage({ url: '/manager/bookings' });
});

describe('manager/bookings page', () => {
	it('shows "No bookings yet" without filters', () => {
		renderPage(makeData({ bookings: [], total: 0 }));
		expect(screen.getByText('No bookings yet')).toBeInTheDocument();
	});

	it.each([{ query: 'x' }, { statusFilter: 'pending' }])('shows filtered empty state for %o', (f) => {
		renderPage(makeData({ bookings: [], total: 0, ...f }));
		expect(screen.getByText('No bookings match your filters')).toBeInTheDocument();
	});

	it('lists bookings in table and mobile list', () => {
		renderPage();
		expect(screen.getAllByText('Pat One')).toHaveLength(2);
		expect(screen.getAllByText('Cardiology · Central Health')).toHaveLength(2);
		expect(screen.getByText('2 total')).toBeInTheDocument();
	});

	it('export link without and with query params', () => {
		const { unmount } = renderPage();
		expect(screen.getByRole('link', { name: /Export CSV/ })).toHaveAttribute('href', '/manager/export.csv');
		unmount();
		setPage({ url: '/manager/bookings?status=pending' });
		renderPage();
		expect(screen.getByRole('link', { name: /Export CSV/ })).toHaveAttribute(
			'href',
			'/manager/export.csv?status=pending'
		);
	});

	it('status tabs highlight active and navigate', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/bookings?status=pending&page=2' });
		renderPage(makeData({ statusFilter: 'pending' }));
		const pendingTab = screen.getByRole('button', { name: /^Pending\s*3$/ });
		expect(pendingTab.className).toContain('bg-primary');
		expect(screen.getByRole('button', { name: /^All\s*9$/ }).className).not.toContain('bg-primary text-on-primary');
		await user.click(screen.getByRole('button', { name: /^Completed/ }));
		expect(goto).toHaveBeenLastCalledWith('?status=completed');
		await user.click(screen.getByRole('button', { name: /^All/ }));
		expect(goto).toHaveBeenLastCalledWith('/manager/bookings');
	});

	it('all tab keeps other params', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/bookings?q=pat&status=pending' });
		renderPage();
		await user.click(screen.getByRole('button', { name: /^All/ }));
		expect(goto).toHaveBeenLastCalledWith('?q=pat');
	});

	it('searches and clears search', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/bookings?page=3' });
		renderPage(makeData({ query: 'old' }));
		const input = screen.getByPlaceholderText(/Search patient/);
		expect(input).toHaveValue('old');
		await user.clear(input);
		await user.type(input, 'pat{Enter}');
		expect(goto).toHaveBeenLastCalledWith('?q=pat', { reset: false });
		await user.clear(input);
		await user.type(input, '{Enter}');
		expect(goto).toHaveBeenLastCalledWith('/manager/bookings', { reset: false });
	});

	it('updates booking status (success)', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Pat One · Dr. Alice')).toBeInTheDocument();
		expect(within(dialog).getByText('09:00')).toBeInTheDocument();
		const select = within(dialog).getByRole('combobox');
		expect(select).toHaveValue('pending');
		await user.selectOptions(select, 'completed');
		await user.click(within(dialog).getByRole('button', { name: 'Save' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/updateStatus');
		expect(submissions[0].formData.get('id')).toBe('b1');
		expect(submissions[0].formData.get('status')).toBe('completed');
		expect(messages()).toContain('Booking status updated.');
	});

	it('shows error on status update failure', async () => {
		const user = userEvent.setup();
		renderPage();
		// mobile edit button of second booking
		await user.click(screen.getAllByRole('button', { name: 'Edit' })[3]);
		expect(within(screen.getByRole('dialog')).getByRole('combobox')).toHaveValue('confirmed');
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'Invalid status.' } });
		await fireEvent.submit(document.getElementById('booking-form') as HTMLFormElement);
		await waitFor(() => expect(messages()).toContain('Invalid status.'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('cancel closes the modal', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});
});

describe('manager/bookings page – nullish data', () => {
	it('renders rows with nullish text fields and missing status counts', () => {
		renderPage(
			makeData({
				statusCounts: {},
				bookings: [
					{
						...bookings[0],
						doctorName: null,
						specialty: null,
						hospital: null,
						appointmentTime: null
					}
				]
			})
		);
		expect(screen.getAllByText('Pat One')).toHaveLength(2);
		expect(screen.getByText('with')).toBeInTheDocument();
	});
});
