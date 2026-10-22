import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setEnhanceResult, submissions } from '../../../test/mocks/app-forms.ts';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import { toast } from '#lib/stores/toast.svelte.ts';
import { escapeThenConfirm, pressEscape, slowNextUpdate } from '../../../test/helpers-pages-manager.ts';
import Page from './+page.svelte';

const specialists = [
	{ id: 's1', name: 'Cardiology', slug: 'cardiology', icon: 'heart', createdAt: new Date() },
	{ id: 's2', name: 'Dental', slug: 'dental', icon: null, createdAt: new Date() }
];

function makeData(overrides: Record<string, unknown> = {}) {
	return { specialists, total: 2, page: 1, pageSize: 10, query: '', ...overrides };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });
const messages = () => toast.toasts.map((t) => t.message);

beforeEach(() => {
	toast.clear();
	setPage({ url: '/manager/specialists' });
});

describe('manager/specialists page', () => {
	it('shows empty state without query', () => {
		renderPage(makeData({ specialists: [], total: 0 }));
		expect(screen.getByText('No specialties yet')).toBeInTheDocument();
		expect(screen.getByText(/so doctors can be categorized/)).toBeInTheDocument();
	});

	it('shows empty state for a search', () => {
		renderPage(makeData({ specialists: [], total: 0, query: 'x' }));
		expect(screen.getByText('No specialties found')).toBeInTheDocument();
		expect(screen.getByText('Try a different keyword.')).toBeInTheDocument();
	});

	it('lists specialties with icon fallback', () => {
		renderPage();
		expect(screen.getByText('Cardiology')).toBeInTheDocument();
		expect(screen.getByText('cardiology')).toBeInTheDocument();
		expect(screen.getByText('heart')).toBeInTheDocument();
		expect(screen.getByText('—')).toBeInTheDocument();
	});

	it('searches and clears search', async () => {
		const user = userEvent.setup();
		setPage({ url: '/manager/specialists?page=2&x=1' });
		renderPage();
		const input = screen.getByPlaceholderText(/Search specialties/);
		await user.type(input, 'card{Enter}');
		expect(goto).toHaveBeenLastCalledWith('?x=1&q=card', { reset: false });
		setPage({ url: '/manager/specialists?page=2' });
		await user.clear(input);
		await user.type(input, '{Enter}');
		expect(goto).toHaveBeenLastCalledWith('/manager/specialists', { reset: false });
	});

	it('creates a specialty', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Specialty' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Create a new medical specialty category')).toBeInTheDocument();
		await user.type(within(dialog).getByPlaceholderText('Cardiology'), 'Neuro');
		await user.type(within(dialog).getByPlaceholderText('cardiology'), 'neuro');
		await user.type(within(dialog).getByPlaceholderText(/heart, eye/), 'brain');
		await user.click(within(dialog).getByRole('button', { name: 'Create' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/create');
		expect(submissions[0].formData.get('name')).toBe('Neuro');
		expect(submissions[0].formData.get('slug')).toBe('neuro');
		expect(submissions[0].formData.get('icon')).toBe('brain');
		expect(messages()).toContain('Specialty created.');
	});

	it('shows error on create failure', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Add Specialty' }));
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'Slug taken.' } });
		await fireEvent.submit(document.getElementById('specialist-form') as HTMLFormElement);
		await waitFor(() => expect(messages()).toContain('Slug taken.'));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('edits a specialty with prefill', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit Cardiology' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('Edit specialty')).toBeInTheDocument();
		expect(within(dialog).getByPlaceholderText(/heart, eye/)).toHaveValue('heart');
		await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/update');
		expect(submissions[0].formData.get('id')).toBe('s1');
		expect(submissions[0].formData.get('slug')).toBe('cardiology');
		expect(messages()).toContain('Specialty updated.');
	});

	it('edit with null icon; cancel closes', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Edit Dental' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByPlaceholderText(/heart, eye/)).toHaveValue('');
		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it.each([
		[{ type: 'success', status: 200, data: {} }, 'Specialty "Cardiology" deleted.'],
		[{ type: 'failure', status: 409, data: { error: 'In use.' } }, 'In use.'],
		[{ type: 'failure', status: 400, data: {} }, 'Failed to delete specialty.']
	] as const)('deletes via confirm dialog (%o)', async (result, expected) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Cardiology' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText(/Delete "Cardiology"\?/)).toBeInTheDocument();
		setEnhanceResult(result as never);
		await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions[0].action.search).toBe('?/delete');
		expect(messages()).toContain(expected);
	});

	it('delete with network error shows only the generic toast', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Dental' }));
		setEnhanceResult({ type: 'error', error: new Error('x') });
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(toast.toasts).toHaveLength(0);
	});

	it('cancels delete dialog', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Cardiology' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it.each([
		['Cardiology', 's1'],
		['Dental', 's2']
	])('delete posts the target specialty id (%s)', async (name, id) => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: `Delete ${name}` }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].formData.get('id')).toBe(id);
	});
});

describe('manager/specialists page – delete edge cases', () => {
	it('confirmDelete is a no-op once the target was cleared', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Cardiology' }));
		escapeThenConfirm(screen.getByRole('dialog'));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(submissions).toHaveLength(0);
	});

	it('handles the target being cleared while the delete is in flight', async () => {
		const user = userEvent.setup();
		renderPage();
		await user.click(screen.getByRole('button', { name: 'Delete Cardiology' }));
		slowNextUpdate();
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
		pressEscape();
		await waitFor(() => expect(messages()).toContain('Specialty "" deleted.'));
	});

	it('renders a row and dialog for a specialty with a null name', async () => {
		const user = userEvent.setup();
		renderPage(makeData({ specialists: [{ ...specialists[1], id: 'sx', name: null, slug: null }] }));
		await user.click(screen.getByRole('button', { name: 'Edit' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await user.click(screen.getByRole('button', { name: 'Delete' }));
		expect(within(screen.getByRole('dialog')).getByText(/^Delete ""\?/)).toBeInTheDocument();
	});
});
