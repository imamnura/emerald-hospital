import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { submissions } from '../../../test/mocks/app-forms.ts';
import LogoutButton from './LogoutButton.svelte';
import ProfileLink from './ProfileLink.svelte';

describe('ProfileLink', () => {
	it('renders the avatar image when there is one', () => {
		render(ProfileLink, { imageUrl: '/me.png', name: 'Jane Doe' });
		expect(screen.getByRole('img', { name: 'Jane Doe' })).toHaveAttribute('src', '/me.png');
		expect(screen.queryByRole('link')).toBeNull();
	});

	it('falls back to an initials link to the profile', () => {
		render(ProfileLink, { imageUrl: null, name: 'Jane Doe' });
		const link = screen.getByRole('link', { name: 'JD' });
		expect(link).toHaveAttribute('href', '/profile');
	});
});

describe('LogoutButton', () => {
	it('defaults to "Logout" and posts ?/logout', async () => {
		render(LogoutButton);
		const button = screen.getByRole('button', { name: 'Logout' });
		await fireEvent.submit(button.closest('form')!);
		expect(submissions.at(-1)!.action.search).toBe('?/logout');
	});

	it('accepts a label and form classes', () => {
		render(LogoutButton, { label: 'Sign Out', class: 'mt-8 pb-4' });
		const button = screen.getByRole('button', { name: 'Sign Out' });
		expect(button.closest('form')).toHaveClass('mt-8', 'pb-4');
	});
});
