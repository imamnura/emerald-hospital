import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeleteConfirm from './DeleteConfirm.svelte';

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
