import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import Dialog from './Dialog.svelte';

describe('Dialog', () => {
	it('closes on Escape and labels itself', async () => {
		const onclose = vi.fn();
		render(Dialog, { open: true, title: 'Hi', onclose, children: snip('<p>body</p>') });
		expect(screen.getByRole('dialog', { name: 'Hi' })).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('closes on backdrop click', async () => {
		const onclose = vi.fn();
		render(Dialog, { open: true, title: 'Hi', onclose, children: snip('<p>body</p>') });
		await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('gives two dialogs distinct title ids', () => {
		render(Dialog, { open: true, title: 'One', children: snip('<p>a</p>') });
		render(Dialog, { open: true, title: 'Two', children: snip('<p>b</p>') });
		const [a, b] = screen.getAllByRole('dialog');
		const idA = a.getAttribute('aria-labelledby');
		const idB = b.getAttribute('aria-labelledby');
		expect(idA).toBeTruthy();
		expect(idA).not.toBe(idB);
		expect(document.getElementById(idA!)).toHaveTextContent('One');
		expect(document.getElementById(idB!)).toHaveTextContent('Two');
	});

	it('renders nothing when closed', () => {
		render(Dialog, { open: false, title: 'Hi', children: snip('<p>body</p>') });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('supports the centered variant, a custom class and a footer', () => {
		render(Dialog, {
			open: true,
			variant: 'centered',
			class: 'max-w-sm',
			children: snip('<p>body</p>'),
			footer: snip('<button>Go</button>')
		});
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveClass('max-w-sm', 'rounded-2xl');
		expect(dialog).not.toHaveAttribute('aria-labelledby');
		expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
	});
});

describe('Dialog stacking', () => {
	it('keeps the panel positioned above the backdrop with a custom panelClass', () => {
		render(Dialog, { open: true, panelClass: 'w-full p-6', children: snip('<p>body</p>') });
		expect(screen.getByRole('dialog')).toHaveClass('relative', 'w-full', 'p-6');
		expect(screen.getByRole('button', { name: 'Close modal' })).toHaveClass('absolute');
	});
});

describe('Dialog labelledby', () => {
	it('names an untitled dialog by an element inside it', () => {
		render(Dialog, {
			open: true,
			labelledby: 'inner-title',
			children: snip('<h2 id="inner-title">Inside</h2>')
		});
		expect(screen.getByRole('dialog', { name: 'Inside' })).toBeInTheDocument();
	});
});
