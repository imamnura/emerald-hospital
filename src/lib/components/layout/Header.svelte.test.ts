import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Header from './Header.svelte';

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
