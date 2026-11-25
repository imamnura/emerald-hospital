import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import BindHarness from '../../test/harness/BindHarness.svelte';
import { setPage } from '../../test/mocks/app-state.svelte.ts';
import BottomNav from './BottomNav.svelte';
import Header from './Header.svelte';
import SearchBar from './SearchBar.svelte';

describe('Header', () => {
	it('renders guest initials and search link by default', () => {
		render(Header);
		expect(screen.getByText('G')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Purwakarta Health' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');
	});

	it('renders user image and notification button', () => {
		render(Header, {
			userName: 'Jane Doe',
			userImage: '/u.png',
			showSearch: false,
			showNotification: true
		});
		expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute('src', '/u.png');
		expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Search' })).toBeNull();
	});

	it('renders user icon and spacer when no trailing action', () => {
		const { container } = render(Header, {
			userName: 'John Ronald Smith',
			leadingIcon: 'user',
			showSearch: false
		});
		expect(container.querySelector('.lucide-user')).toBeInTheDocument();
		expect(screen.queryByText('JR')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
		expect(container.querySelector('div.w-10')).toBeInTheDocument();
	});

	it('limits initials to two letters', () => {
		render(Header, { userName: 'john ronald smith' });
		expect(screen.getByText('JR')).toBeInTheDocument();
	});
});

describe('BottomNav', () => {
	it('marks the current route as active', () => {
		setPage({ url: '/appointments' });
		render(BottomNav);
		const links = screen.getAllByRole('link');
		expect(links.map((l) => l.getAttribute('href'))).toEqual(['/home', '/appointments', '/profile']);
		expect(screen.getByText('Appointments')).toHaveClass('text-primary');
		expect(screen.getByText('Home')).toHaveClass('text-outline');
		expect(links[1].querySelector('span')).toHaveClass('bg-primary');
		expect(links[0].querySelector('span')).not.toHaveClass('bg-primary');
	});
});

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
