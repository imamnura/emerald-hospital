import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import ProfileMenuItem from './ProfileMenuItem.svelte';

describe('ProfileMenuItem', () => {
	it('renders link with label and icon', () => {
		render(ProfileMenuItem, {
			href: '/profile/edit',
			label: 'Edit Profile',
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByRole('link', { name: /Edit Profile/ })).toHaveAttribute(
			'href',
			'/profile/edit'
		);
		expect(screen.getByTestId('ic')).toBeInTheDocument();
	});
});
