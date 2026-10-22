import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setEnhanceResult, submissions } from '../../../test/mocks/app-forms.ts';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import { escapeThenConfirm, pressEscape, slowNextUpdate } from '../../../test/helpers-pages-manager.ts';
import Page from './+page.svelte';

const schedules = [
	{
		id: 'sc1',
		doctorId: 'd1',
		dayOfWeek: 1,
		startTime: '08:00',
		endTime: '12:00',
		maxQuota: 7,
		doctorName: 'Dr. Alice'
	},
	{
		id: 'sc2',
		doctorId: 'd2',
		dayOfWeek: 3,
		startTime: '13:00',
		endTime: '17:00',
		maxQuota: 4,
		doctorName: 'Dr. Bob'
	}
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		schedules,
		total: 2,
		page: 1,
		pageSize: 10,
		query: '',
		doctorFilter: '',
		doctors: [
			{ id: 'd1', name: 'Dr. Alice' },
			{ id: 'd2', name: 'Dr. Bob' }
		],
		...overrides
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });
const messages = () => toast.toasts.map((t) => t.message);

beforeEach(() => {
	toast.clear();
	setPage({ url: '/manager/schedules' });
});

describe('manager/schedules page', () => {
	it('shows "No schedules yet" without filters', () => {
		renderPage(makeData({ schedules: [], total: 0 }));
		expect(screen.getByText('No schedules yet')).toBeInTheDocument();
	});

	it.each([{ query: 'x' }, { doctorFilter: 'd1' }])('shows filtered empty state for %o', (f) => {
		renderPage(makeData({ schedules: [], total: 0, ...f }));
		expect(screen.getByText('No schedules match your filters')).toBeInTheDocument();
	});

	it('lists schedules', () => {
		renderPage();
		expect(screen.getByText('2 slots')).toBeInTheDocument();
		expect(screen.getByText('Senin')).toBeInTheDocument();
		expect(screen.getByText('Rabu')).toBeInTheDocument();
		expect(screen.getByText('08:00 – 12:00')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	it('applies search and doctor filter, then clears', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/schedules?page=2' });
		renderPage();
		await user.type(screen.getByPlaceholderText('Search by doctor name'), 'ali{Enter}');
		expect(goto).toHaveBeenLastCalledWith('?q=ali', { reset: false });
		await user.selectOptions(screen.getByLabelText('Filter by doctor'), 'd2');
		expect(goto).toHaveBeenLastCalledWith('?q=ali&doctorId=d2', { reset: false });
		await user.clear(screen.getByPlaceholderText('Search by doctor name'));
		await user.selectOptions(screen.getByLabelText('Filter by doctor'), '');
		expect(goto).toHaveBeenLastCalledWith('/manager/schedules', { reset: false });
		await user.click(screen.getByRole('button', { name: 'Apply' }));
		expect(goto).toHaveBeenLastCalledWith('/manager/schedules', { reset: false });
	});

	it('creates a schedule with defaults', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Schedule' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Block of consulting hours for a doctor')).toBeInTheDocument();
		const [doctorSel, daySel] = within(dialog).getAllByRole('combobox');
		await user.selectOptions(doctorSel, 'd1');
		await user.selectOptions(daySel, '1');
		await user.click(within(dialog).getByRole('button', { name: 'Create' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		const fd = submissions[0].formData;
		expect(submissions[0].action.search).toBe('?/create');
		expect(fd.get('doctorId')).toBe('d1');
		expect(fd.get('dayOfWeek')).toBe('1');
		expect(fd.get('maxQuota')).toBe('5');
		expect(fd.get('startTime')).toBe('08:00');
		expect(fd.get('endTime')).toBe('12:00');
		expect(messages()).toContain('Schedule created.');
	});

	it('shows error on create failure', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Schedule' }));
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'Overlap.' } });
		await fireEvent.submit(document.getElementById('schedule-form') as HTMLFormElement);
		await waitFor(() => expect(messages()).toContain('Overlap.'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('edits a schedule with prefill', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit schedule' })[1]);
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Edit schedule')).toBeInTheDocument();
		expect(within(dialog).getByText('Dr. Bob · Rabu')).toBeInTheDocument();
		await user.selectOptions(within(dialog).getAllByRole('combobox')[1], '3');
		await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		const fd = submissions[0].formData;
		expect(submissions[0].action.search).toBe('?/update');
		expect(fd.get('id')).toBe('sc2');
		expect(fd.get('doctorId')).toBe('d2');
		expect(fd.get('dayOfWeek')).toBe('3');
		expect(fd.get('maxQuota')).toBe('4');
		expect(fd.get('startTime')).toBe('13:00');
		expect(messages()).toContain('Schedule updated.');
	});

	it('prefills the day-of-week select with the saved day on edit', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit schedule' })[1]);
		expect(within(screen.getByRole('dialog')).getAllByRole('combobox')[1]).toHaveValue('3');
	});

	it('pre-selects Monday on create and submits it without re-picking', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Schedule' }));
		const dialog = screen.getByRole('dialog');
		const [doctorSel, daySel] = within(dialog).getAllByRole('combobox');
		expect(daySel).toHaveValue('1');
		await user.selectOptions(doctorSel, 'd2');
		await user.click(within(dialog).getByRole('button', { name: 'Create' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('dayOfWeek')).toBe('1');
	});

	it('edit submits the saved day unchanged', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit schedule' })[1]);
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save Changes' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('dayOfWeek')).toBe('3');
	});

	it('cancel closes the edit modal', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Edit schedule' })[0]);
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it.each([
		[{ type: 'success', status: 200, data: {} }, 'Schedule deleted.'],
		[{ type: 'failure', status: 404, data: { error: 'Schedule not found.' } }, 'Schedule not found.'],
		[{ type: 'failure', status: 400, data: {} }, 'Failed to delete schedule.']
	] as const)('deletes via confirm dialog (%o)', async (result, expected) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[0]);
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText(/Delete the Senin 08:00–12:00 slot for Dr. Alice\?/)).toBeInTheDocument();
		setEnhanceResult(result as never);
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/delete');
		expect(messages()).toContain(expected);
	});

	it('delete with network error shows no delete toast', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[1]);
		setEnhanceResult({ type: 'error', error: new Error('x') });
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(toast.toasts).toHaveLength(0);
	});

	it('cancels delete dialog', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[0]);
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it.each([
		[0, 'sc1'],
		[1, 'sc2']
	])('delete posts the target schedule id (row %i)', async (row, id) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[row]);
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('id')).toBe(id);
	});
});

describe('manager/schedules page – delete edge cases', () => {
	it('confirmDelete is a no-op once the target was cleared', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[0]);
		escapeThenConfirm(screen.getByRole('dialog'));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it('handles the target being cleared while the delete is in flight', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getAllByRole('button', { name: 'Delete schedule' })[0]);
		slowNextUpdate();
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		pressEscape();
		await waitFor(() => expect(messages()).toContain('Schedule deleted.'));
	});

	it('handles nullish fields/option ids and re-renders with fresh data', async () => {
		const user = userEvent.setup();
		const data = makeData({
			schedules: [{ ...schedules[0], startTime: null, endTime: null, maxQuota: null }],
			doctors: [{ id: null, name: 'Nobody' }, { id: 'd1', name: 'Dr. Alice' }]
		});
		const { rerender } = renderPage(data);
		await user.click(screen.getByRole('button', { name: 'Add Schedule' }));
		await rerender({ data: structuredClone(data) } as never);
		expect(screen.getAllByRole('option', { name: 'Nobody' })[0]).toHaveValue('');
		expect(screen.getByText('–')).toBeInTheDocument();
	});
});
