import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../../test/mocks/app-forms.ts';

function data(profile: Record<string, unknown> = {}) {
	return {
		user: null,
		profile: { id: 'u1', name: 'jane mary doe', imageUrl: null, role: 'patient', ...profile },
		memberSince: 'Jan 2024',
		stats: { bloodType: 'O+', nextVisit: 'Jan 5', reports: 3 }
	};
}

describe('profile page', () => {
	it('renders initials, stats, menu and logout', async () => {
		render(Page, { props: { data: data() } as never });
		expect(screen.getByText('JM')).toBeInTheDocument();
		expect(screen.getByText('Member since Jan 2024')).toBeInTheDocument();
		expect(screen.getByText('O+')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Personal Information/ })).toHaveAttribute(
			'href',
			'/profile/personal'
		);
		expect(screen.queryByText('Manager Dashboard')).toBeNull();
		await fireEvent.submit(screen.getByRole('button', { name: /Logout/ }).closest('form')!);
		expect(submissions[0].action.search).toBe('?/logout');
	});

	it('renders image and manager link', () => {
		render(Page, {
			props: {
				data: { ...data({ imageUrl: 'https://img/u.png', role: 'manager' }), memberSince: null }
			} as never
		});
		expect(screen.getByText(/Member since/)).toBeInTheDocument();
		expect(screen.getByAltText('jane mary doe')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Manager Dashboard' })).toHaveAttribute('href', '/manager');
	});
});
