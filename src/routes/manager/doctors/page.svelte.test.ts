import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setEnhanceResult, submissions } from '../../../test/mocks/app-forms.ts';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import { escapeThenConfirm, pressEscape, slowNextUpdate } from '../../../test/helpers-pages-manager.ts';
import Page from './+page.svelte';

const doctors = [
	{
		id: 'd1',
		name: 'Dr. Alice Smith',
		rating: '4.8',
		isActive: true,
		isOnline: false,
		imageUrl: 'https://img/a.png',
		consultationFee: '150.00',
		bio: 'Heart doctor',
		hospital: 'Central Health',
		hospitalId: 'h1',
		specialty: 'Cardiology',
		specialistId: 's1'
	},
	{
		id: 'd2',
		name: 'Bob Jones',
		rating: '4.1',
		isActive: false,
		isOnline: false,
		imageUrl: null,
		consultationFee: null,
		bio: null,
		hospital: 'East Clinic',
		hospitalId: 'h2',
		specialty: 'Dental',
		specialistId: 's2'
	}
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		doctors,
		total: 2,
		page: 1,
		pageSize: 10,
		query: '',
		hospitalFilter: '',
		specialistFilter: '',
		hospitals: [
			{ id: 'h1', name: 'Central Health' },
			{ id: 'h2', name: 'East Clinic' }
		],
		specialists: [
			{ id: 's1', name: 'Cardiology' },
			{ id: 's2', name: 'Dental' }
		],
		...overrides
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });
const messages = () => toast.toasts.map((t) => t.message);

beforeEach(() => {
	toast.clear();
	setPage({ url: '/manager/doctors' });
});

describe('manager/doctors page', () => {
	it('shows "No doctors yet" without filters', () => {
		renderPage(makeData({ doctors: [], total: 0 }));
		expect(screen.getByText('No doctors yet')).toBeInTheDocument();
	});

	it.each([{ query: 'x' }, { hospitalFilter: 'h1' }, { specialistFilter: 's1' }])(
		'shows filtered empty state for %o',
		(f) => {
			renderPage(makeData({ doctors: [], total: 0, ...f }));
			expect(screen.getByText('No doctors match your filters')).toBeInTheDocument();
		}
	);

	it('lists doctors with initials, rating and active state', () => {
		renderPage();
		expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
		expect(screen.getByText('A')).toBeInTheDocument();
		expect(screen.getByText('B')).toBeInTheDocument();
		expect(screen.getByText('4.8')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Inactive')).toBeInTheDocument();
	});

	it('applies search and select filters', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/doctors?page=4' });
		renderPage();
		await user.type(screen.getByPlaceholderText(/Search by name/), 'ali{Enter}');
		expect(goto).toHaveBeenLastCalledWith('?q=ali', { reset: false });
		await user.selectOptions(screen.getByLabelText('Filter by hospital'), 'h2');
		expect(goto).toHaveBeenLastCalledWith('?q=ali&hospitalId=h2', { reset: false });
		await user.selectOptions(screen.getByLabelText('Filter by specialty'), 's1');
		expect(goto).toHaveBeenLastCalledWith('?q=ali&hospitalId=h2&specialistId=s1', { reset: false });
	});

	it('clears all filters back to the pathname', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/doctors?q=a&hospitalId=h1&specialistId=s1&page=2' });
		renderPage(makeData({ query: 'a', hospitalFilter: 'h1', specialistFilter: 's1' }));
		expect(screen.getByLabelText('Filter by hospital')).toHaveValue('h1');
		await user.clear(screen.getByPlaceholderText(/Search by name/));
		await user.selectOptions(screen.getByLabelText('Filter by hospital'), '');
		await user.selectOptions(screen.getByLabelText('Filter by specialty'), '');
		expect(goto).toHaveBeenLastCalledWith('/manager/doctors', { reset: false });
		await user.click(screen.getByRole('button', { name: 'Apply' }));
		expect(goto).toHaveBeenLastCalledWith('/manager/doctors', { reset: false });
	});

	it('creates a doctor with defaults', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Doctor' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Onboard a new physician')).toBeInTheDocument();
		await user.type(within(dialog).getByPlaceholderText('Dr. Jane Doe'), 'Dr. New');
		const [hospitalSel, specialtySel] = within(dialog).getAllByRole('combobox');
		await user.selectOptions(hospitalSel, 'h1');
		await user.selectOptions(specialtySel, 's2');
		await user.click(within(dialog).getByRole('button', { name: 'Create' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		const fd = submissions[0].formData;
		expect(submissions[0].action.search).toBe('?/create');
		expect(fd.get('name')).toBe('Dr. New');
		expect(fd.get('hospitalId')).toBe('h1');
		expect(fd.get('specialistId')).toBe('s2');
		expect(fd.get('rating')).toBe('4.5');
		expect(fd.get('isActive')).toBe('on');
		expect(messages()).toContain('Doctor created.');
	});

	it('shows error on create failure', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Doctor' }));
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'Bad doctor.' } });
		await fireEvent.submit(document.getElementById('doctor-form') as HTMLFormElement);
		await waitFor(() => expect(messages()).toContain('Bad doctor.'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('edits a doctor with prefilled fields', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit Dr. Alice Smith' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Edit doctor')).toBeInTheDocument();
		expect(within(dialog).getByPlaceholderText('150.00')).toHaveValue(150);
		expect(within(dialog).getByPlaceholderText(/Short professional bio/)).toHaveValue('Heart doctor');
		expect(within(dialog).getByRole('checkbox')).toBeChecked();
		await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		const fd = submissions[0].formData;
		expect(submissions[0].action.search).toBe('?/update');
		expect(fd.get('id')).toBe('d1');
		expect(fd.get('hospitalId')).toBe('h1');
		expect(fd.get('specialistId')).toBe('s1');
		expect(fd.get('rating')).toBe('4.8');
		expect(messages()).toContain('Doctor updated.');
	});

	it('edit of inactive doctor with null fields; cancel closes', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit Bob Jones' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByRole('checkbox')).not.toBeChecked();
		expect(within(dialog).getByPlaceholderText('150.00')).toHaveValue(null);
		expect(within(dialog).getByPlaceholderText('https://…')).toHaveValue('');
		expect(within(dialog).getByPlaceholderText(/Short professional bio/)).toHaveValue('');
		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it.each([
		[{ type: 'success', status: 200, data: {} }, 'Doctor "Dr. Alice Smith" deleted.'],
		[{ type: 'failure', status: 404, data: { error: 'Doctor not found.' } }, 'Doctor not found.'],
		[{ type: 'failure', status: 400, data: {} }, 'Failed to delete doctor.']
	] as const)('deletes via confirm dialog (%o)', async (result, expected) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Dr. Alice Smith' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText(/Delete "Dr. Alice Smith"\?/)).toBeInTheDocument();
		setEnhanceResult(result as never);
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/delete');
		expect(messages()).toContain(expected);
	});

	it('delete with network error shows no delete toast', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Bob Jones' }));
		setEnhanceResult({ type: 'error', error: new Error('x') });
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(toast.toasts).toHaveLength(0);
	});

	it('cancels delete dialog', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Bob Jones' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it.each([
		['Dr. Alice Smith', 'd1'],
		['Bob Jones', 'd2']
	])('delete posts the target doctor id (%s)', async (name, id) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: `Delete ${name}` }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('id')).toBe(id);
	});
});

describe('manager/doctors page – delete edge cases', () => {
	it('confirmDelete is a no-op once the target was cleared', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Bob Jones' }));
		escapeThenConfirm(screen.getByRole('dialog'));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it('handles the target being cleared while the delete is in flight', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Bob Jones' }));
		slowNextUpdate();
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		pressEscape();
		await waitFor(() => expect(messages()).toContain('Doctor "" deleted.'));
	});

	it('handles nullish option ids/rating and re-renders with fresh data', async () => {
		const user = userEvent.setup();
		const data = makeData({
			doctors: [{ ...doctors[1], rating: null }],
			hospitals: [{ id: null, name: 'Nowhere' }, { id: 'h1', name: 'Central Health' }],
			specialists: [{ id: null, name: 'None' }, { id: 's1', name: 'Cardiology' }]
		});
		const { rerender } = renderPage(data);
		await user.click(screen.getByRole('button', { name: 'Add Doctor' }));
		await rerender({ data: structuredClone(data) } as never);
		expect(screen.getAllByRole('option', { name: 'Nowhere' })[0]).toHaveValue('');
		expect(screen.getByText('Bob Jones')).toBeInTheDocument();
	});
});
