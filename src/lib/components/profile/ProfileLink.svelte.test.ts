import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
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
