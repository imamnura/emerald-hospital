import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import DeleteConfirm from './DeleteConfirm.svelte';
import ManagerSearchForm from './ManagerSearchForm.svelte';
import Modal from './Modal.svelte';
import PageHeader from './PageHeader.svelte';
import RowActions from './RowActions.svelte';

afterEach(() => vi.restoreAllMocks());

describe('DeleteConfirm', () => {
	it('submits the target id', async () => {
		const submit = vi
			.spyOn(HTMLFormElement.prototype, 'requestSubmit')
			.mockImplementation(function (this: HTMLFormElement) {
				expect(new FormData(this).get('id')).toBe('abc');
			});
		// `target` is also a Svelte mount option, so props go under `props`.
		render(DeleteConfirm, {
			props: { open: true, target: { id: 'abc', name: 'X' }, title: 'Delete', message: 'Sure?' }
		});
		await userEvent.click(screen.getByRole('button', { name: /delete/i }));
		expect(submit).toHaveBeenCalledOnce();
	});

	it('posts to the given action', () => {
		const { container } = render(DeleteConfirm, {
			props: {
				open: true,
				target: { id: 'abc' },
				action: '?/remove',
				title: 'Delete',
				message: 'Sure?'
			}
		});
		expect(container.querySelector('form')).toHaveAttribute('action', '?/remove');
	});
});

describe('ManagerSearchForm', () => {
	it('submits the trimmed query', async () => {
		const onsubmit = vi.fn();
		render(ManagerSearchForm, { value: '  ali ', placeholder: 'Search', onsubmit });
		const input = screen.getByPlaceholderText('Search');
		await fireEvent.submit(input.closest('form')!);
		expect(onsubmit).toHaveBeenCalledWith('ali');
	});

	it('renders filters next to the input', () => {
		render(ManagerSearchForm, {
			value: '',
			placeholder: 'Search',
			onsubmit: vi.fn(),
			filters: snip('<button>Apply</button>')
		});
		expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
	});
});

describe('RowActions', () => {
	it('labels and fires edit and delete', async () => {
		const onedit = vi.fn();
		const ondelete = vi.fn();
		render(RowActions, { name: 'Bob', onedit, ondelete });
		await fireEvent.click(screen.getByLabelText('Edit Bob'));
		await fireEvent.click(screen.getByLabelText('Delete Bob'));
		expect(onedit).toHaveBeenCalledOnce();
		expect(ondelete).toHaveBeenCalledOnce();
	});

	it('omits delete without a handler', () => {
		render(RowActions, { name: 'Bob', onedit: vi.fn() });
		expect(screen.queryByLabelText('Delete Bob')).toBeNull();
	});
});

describe('Modal form footer', () => {
	it('renders cancel and a submit bound to the form', () => {
		render(Modal, {
			open: true,
			title: 'T',
			formId: 'f1',
			submitLabel: 'Create',
			children: snip('<form id="f1"></form>')
		});
		expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('form', 'f1');
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
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
