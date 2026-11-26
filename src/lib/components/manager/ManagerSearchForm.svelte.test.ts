import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import ManagerSearchForm from './ManagerSearchForm.svelte';

afterEach(() => vi.restoreAllMocks());

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
