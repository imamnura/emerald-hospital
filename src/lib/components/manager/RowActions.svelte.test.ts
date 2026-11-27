import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RowActions from './RowActions.svelte';

afterEach(() => vi.restoreAllMocks());

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
