import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import BindHarness from '#test/harness/BindHarness.svelte';
import SearchBar from './SearchBar.svelte';

describe('SearchBar', () => {
	it('renders defaults without clear button', () => {
		render(SearchBar);
		const input = screen.getByRole('searchbox');
		expect(input).toHaveAttribute('name', 'q');
		expect(input).toHaveAttribute('placeholder', 'Search doctor, specialist, or hospital..');
		expect(input).toHaveClass('rounded-full');
		expect(screen.queryByLabelText('Clear search')).toBeNull();
	});

	it('shows clear when value present and clears bound value', async () => {
		const onClear = vi.fn();
		const oninput = vi.fn();
		render(BindHarness, {
			props: {
				component: SearchBar,
				value: 'cardio',
				props: { showClear: true, onClear, oninput, rounded: '2xl', name: 'search', placeholder: 'Find' }
			}
		});
		const input = screen.getByRole('searchbox');
		expect(input).toHaveValue('cardio');
		expect(input).toHaveClass('rounded-2xl');
		expect(input).toHaveAttribute('placeholder', 'Find');

		await fireEvent.input(input, { target: { value: 'neuro' } });
		expect(oninput).toHaveBeenCalled();
		expect(screen.getByTestId('bound-value')).toHaveTextContent('neuro');

		await fireEvent.click(screen.getByLabelText('Clear search'));
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(input).toHaveValue('');
		expect(screen.getByTestId('bound-value')).toHaveTextContent('');
		expect(screen.queryByLabelText('Clear search')).toBeNull();
	});

	it('clears without onClear callback', async () => {
		render(SearchBar, { value: 'x', showClear: true });
		await fireEvent.click(screen.getByLabelText('Clear search'));
		expect(screen.getByRole('searchbox')).toHaveValue('');
	});
});
