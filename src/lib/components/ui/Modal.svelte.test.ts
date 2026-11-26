import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import Modal from './Modal.svelte';

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
		expect(dialog).toHaveAttribute(
			'aria-labelledby',
			screen.getByRole('heading', { name: 'Edit' }).id
		);
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
