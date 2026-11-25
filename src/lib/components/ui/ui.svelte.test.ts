import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getInitials } from '#lib/format/text.ts';
import { snip } from '../../../test/helpers-components.ts';
import Avatar from './Avatar.svelte';
import BrandMark from './BrandMark.svelte';
import Dialog from './Dialog.svelte';
import FormAlert from './FormAlert.svelte';

describe('Avatar', () => {
	it('falls back to initials', () => {
		render(Avatar, { name: 'Siti Nurhaliza', src: null });
		expect(screen.getByText(getInitials('Siti Nurhaliza'))).toBeInTheDocument();
	});

	it('renders the image with name as alt and size classes', () => {
		render(Avatar, { name: 'Amy Pond', src: '/a.png', size: 'lg', class: 'shrink-0' });
		const img = screen.getByRole('img', { name: 'Amy Pond' });
		expect(img).toHaveAttribute('src', '/a.png');
		expect(img).toHaveClass('h-14', 'w-14', 'rounded-full', 'object-cover', 'shrink-0');
	});

	it('maps every size bucket', () => {
		const expected = { sm: 'h-8', md: 'h-10', lg: 'h-14', xl: 'h-28' } as const;
		for (const [size, cls] of Object.entries(expected)) {
			const { unmount } = render(Avatar, { name: 'A B', size: size as 'sm' });
			expect(screen.getByText('AB')).toHaveClass(cls);
			unmount();
		}
	});

	it('applies fallbackClass only to the initials and honors an initials override', () => {
		render(Avatar, { name: 'Dr. Siti', initials: 'D', fallbackClass: 'bg-surface-container' });
		const el = screen.getByText('D');
		expect(el).toHaveClass('bg-surface-container', 'flex', 'rounded-full');
		expect(el).not.toHaveClass('text-primary');
	});

	it('wraps with a relative container and renders the badge', () => {
		const { container } = render(Avatar, {
			name: 'A B',
			wrapperClass: 'mx-auto w-fit',
			badge: snip('<span data-testid="badge">!</span>')
		});
		expect(screen.getByTestId('badge')).toBeInTheDocument();
		expect(container.firstElementChild).toHaveClass('relative', 'mx-auto', 'w-fit');
	});

	it('renders no wrapper without a badge', () => {
		const { container } = render(Avatar, { name: 'A B' });
		expect(container.firstElementChild).toHaveTextContent('AB');
	});
});

describe('FormAlert', () => {
	it('renders nothing without a message', () => {
		const { container } = render(FormAlert, { message: '' });
		expect(container.textContent).toBe('');
		const nil = render(FormAlert, { message: null });
		expect(nil.container.textContent).toBe('');
	});

	it('renders the error banner classes by default', () => {
		render(FormAlert, { message: 'Boom' });
		expect(screen.getByText('Boom').className).toBe(
			'rounded-xl bg-error-container px-4 py-3 text-sm text-error'
		);
	});

	it('renders the success and info kinds', () => {
		render(FormAlert, { kind: 'success', message: 'Saved' });
		expect(screen.getByText('Saved')).toHaveClass('bg-primary/10', 'text-primary');
		render(FormAlert, { kind: 'info', message: 'FYI' });
		expect(screen.getByText('FYI')).toHaveClass('text-on-surface-variant');
	});
});

describe('BrandMark', () => {
	it('renders the brand name', () => {
		render(BrandMark);
		expect(screen.getByText('Purwakarta Health')).toBeInTheDocument();
	});

	it('uses a bolder icon stroke for md than sm', () => {
		const md = render(BrandMark, { size: 'md' });
		expect(md.container.querySelector('svg')).toHaveAttribute('stroke-width', '2.5');
		const sm = render(BrandMark, { size: 'sm' });
		expect(sm.container.querySelector('svg')).toHaveAttribute('stroke-width', '2');
	});
});

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
