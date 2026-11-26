import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setEnhanceResult, submissions } from '../../../test/mocks/app-forms.ts';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import { escapeThenConfirm, pressEscape, slowNextUpdate } from '../../../test/helpers-pages-manager.ts';
import Page from './+page.svelte';

const hospitals = [
	{
		id: 'h1',
		name: 'Central Health',
		address: 'Jl. Sudirman 1',
		city: 'Jakarta',
		contact: '+62211',
		imageUrl: 'https://img/h1.png',
		createdAt: new Date()
	},
	{
		id: 'h2',
		name: 'East Clinic',
		address: 'Jl. Timur 2',
		city: 'Bandung',
		contact: null,
		imageUrl: null,
		createdAt: new Date()
	}
];

function makeData(overrides: Record<string, unknown> = {}) {
	return { hospitals, total: 2, page: 1, pageSize: 10, query: '', ...overrides };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });

const messages = () => toast.toasts.map((t) => t.message);

beforeEach(() => {
	toast.clear();
	setPage({ url: '/manager/hospitals' });
});

describe('manager/hospitals page', () => {
	it('shows empty state without query', () => {
		renderPage(makeData({ hospitals: [], total: 0 }));
		expect(screen.getByText('No hospitals yet')).toBeInTheDocument();
		expect(screen.getByText('Add your first hospital to get started.')).toBeInTheDocument();
	});

	it('shows empty state for a search', () => {
		renderPage(makeData({ hospitals: [], total: 0, query: 'zzz' }));
		expect(screen.getByText('No hospitals match your search')).toBeInTheDocument();
		expect(screen.getByText('Try a different keyword.')).toBeInTheDocument();
	});

	it('lists hospitals with row numbers and contact fallback', () => {
		renderPage(makeData({ page: 2, pageSize: 10, total: 12 }));
		expect(screen.getByText('Central Health')).toBeInTheDocument();
		expect(screen.getByText('+62211')).toBeInTheDocument();
		expect(screen.getByText('—')).toBeInTheDocument();
		expect(screen.getByText('11')).toBeInTheDocument();
		expect(screen.getByText('12 total')).toBeInTheDocument();
	});

	it('searches and clears search', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/hospitals?page=3' });
		renderPage(makeData({ query: 'old' }));
		const input = screen.getByPlaceholderText(/Search by name/);
		expect(input).toHaveValue('old');
		await user.clear(input);
		await user.type(input, '  jak {Enter}');
		expect(goto).toHaveBeenLastCalledWith('?q=jak', { reset: false });
		await user.clear(input);
		await user.type(input, '{Enter}');
		expect(goto).toHaveBeenLastCalledWith('/manager/hospitals', { reset: false });
	});

	it('creates a hospital (success closes modal + toast)', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Hospital' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Add hospital')).toBeInTheDocument();
		expect(within(dialog).getByText('Create a new partner facility')).toBeInTheDocument();
		await user.type(within(dialog).getByPlaceholderText('Central Health Hospital'), 'New H');
		await user.type(within(dialog).getByPlaceholderText('Jakarta'), 'Bogor');
		await user.type(within(dialog).getByPlaceholderText('Jl. Sudirman No. 45'), 'Jl. X');
		setEnhanceResult({ type: 'success', status: 200, data: { message: 'Hospital created.' } });
		await user.click(within(dialog).getByRole('button', { name: 'Create' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(1);
		expect(submissions[0].action.search).toBe('?/create');
		const fd = submissions[0].formData;
		expect(fd.get('name')).toBe('New H');
		expect(fd.get('city')).toBe('Bogor');
		expect(fd.get('address')).toBe('Jl. X');
		expect(fd.get('id')).toBeNull();
		expect(messages()).toContain('Hospital created.');
	});

	it('shows error toast on create failure and keeps modal open', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Hospital' }));
		const form = document.getElementById('hospital-form') as HTMLFormElement;
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'Name required.' } });
		await fireEvent.submit(form);
		await waitFor(() => expect(messages()).toContain('Name required.'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('edits a hospital with prefilled values', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit Central Health' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Edit hospital')).toBeInTheDocument();
		expect(within(dialog).getByPlaceholderText('Central Health Hospital')).toHaveValue('Central Health');
		expect(within(dialog).getByPlaceholderText('+62211234567')).toHaveValue('+62211');
		expect(within(dialog).getByPlaceholderText('https://…')).toHaveValue('https://img/h1.png');
		setEnhanceResult({ type: 'success', status: 200, data: {} });
		await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/update');
		expect(submissions[0].formData.get('id')).toBe('h1');
		expect(messages()).toContain('Hospital updated.');
	});

	it('edit prefill handles null optional fields; cancel closes modal', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit East Clinic' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByPlaceholderText('+62211234567')).toHaveValue('');
		expect(within(dialog).getByPlaceholderText('https://…')).toHaveValue('');
		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it.each([
		[{ type: 'success', status: 200, data: {} }, 'Hospital "Central Health" deleted.'],
		[{ type: 'failure', status: 404, data: { error: 'Hospital not found.' } }, 'Hospital not found.'],
		[{ type: 'failure', status: 400, data: {} }, 'Failed to delete hospital.']
	] as const)('deletes via confirm dialog (%o)', async (result, expected) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Central Health' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText(/Delete "Central Health"\?/)).toBeInTheDocument();
		setEnhanceResult(result as never);
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/delete');
		expect(messages()).toContain(expected);
	});

	it.each([
		['Central Health', 'h1'],
		['East Clinic', 'h2']
	])('delete posts the target hospital id (%s)', async (name, id) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: `Delete ${name}` }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('id')).toBe(id);
	});

	it('delete with network error shows no delete toast', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete East Clinic' }));
		setEnhanceResult({ type: 'error', error: new Error('x') });
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(toast.toasts).toHaveLength(0);
	});

	it('cancels delete dialog', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Central Health' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});
});

describe('manager/hospitals page – delete edge cases', () => {
	it('confirmDelete is a no-op once the target was cleared', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Central Health' }));
		escapeThenConfirm(screen.getByRole('dialog'));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it('handles the target being cleared while the delete is in flight', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Central Health' }));
		slowNextUpdate();
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		pressEscape();
		await waitFor(() => expect(messages()).toContain('Hospital "" deleted.'));
	});

	it('updates the search input when navigation brings a new query', async () => {
		const { rerender } = render(Page, { props: { data: makeData({ query: 'a' }) } as never });
		expect(screen.getByRole('searchbox')).toHaveValue('a');
		await rerender({ data: makeData({ query: 'b' }) } as never);
		expect(screen.getByRole('searchbox')).toHaveValue('b');
	});

	it('keeps a locally edited search input until navigation changes the query', async () => {
		const user = userEvent.setup();
		const { rerender } = render(Page, { props: { data: makeData({ query: 'a' }) } as never });
		const box = screen.getByRole('searchbox');
		await user.clear(box);
		await user.type(box, 'typed');
		expect(box).toHaveValue('typed');
		await rerender({ data: makeData({ query: 'c' }) } as never);
		expect(screen.getByRole('searchbox')).toHaveValue('c');
	});

	it('renders a row and dialog for a hospital with a null name', async () => {
		const user = userEvent.setup();
		renderPage(makeData({ hospitals: [{ ...hospitals[1], id: 'hx', name: null }] }));
		await user.click(screen.getByRole('button', { name: 'Edit' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await user.click(screen.getByRole('button', { name: 'Delete' }));
		expect(within(screen.getByRole('dialog')).getByText(/^Delete ""\?/)).toBeInTheDocument();
	});
});
