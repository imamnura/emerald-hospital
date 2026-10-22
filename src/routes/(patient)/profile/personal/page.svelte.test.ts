import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../../../test/mocks/app-forms.ts';

function data(profile: Record<string, unknown> = {}, over: Record<string, unknown> = {}) {
	return {
		profile: {
			id: 'u1',
			email: 'jane@example.com',
			name: 'jane doe',
			phone: null,
			imageUrl: null,
			address: null,
			bloodType: null,
			...profile
		},
		dateOfBirth: '',
		gender: 'prefer_not',
		...over
	};
}

describe('personal info page', () => {
	it('renders initials with nullish defaults and live-updates initials', async () => {
		render(Page, { props: { data: data(), form: null } as never });
		expect(screen.getByText('JD')).toBeInTheDocument();
		expect(screen.getByLabelText('Phone Number')).toHaveValue('');
		expect(screen.getByLabelText('Email Address')).toBeDisabled();
		await fireEvent.input(screen.getByLabelText('Full Name'), { target: { value: 'bob smith' } });
		expect(screen.getByText('BS')).toBeInTheDocument();
		await fireEvent.input(screen.getByLabelText('Profile Image URL'), {
			target: { value: 'https://img/x.png' }
		});
		expect(screen.getByAltText('bob smith')).toBeInTheDocument();
	});

	it('renders filled profile, success message and submits', async () => {
		render(Page, {
			props: {
				data: data(
					{ phone: '0812', imageUrl: 'https://img/u.png', address: 'Jl. 1', bloodType: 'O+' },
					{ dateOfBirth: '01/02/1990', gender: 'female' }
				),
				form: { success: true }
			} as never
		});
		expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument();
		expect(screen.getByAltText('jane doe')).toBeInTheDocument();
		expect(screen.getByLabelText('Gender')).toHaveValue('female');
		expect(screen.getByLabelText('Blood Type')).toHaveValue('O+');
		await fireEvent.submit(screen.getByRole('button', { name: /Save Changes/ }).closest('form')!);
		expect(submissions[0].action.search).toBe('?/update');
		expect(submissions[0].formData.get('dateOfBirth')).toBe('01/02/1990');
	});

	it('renders error', () => {
		render(Page, { props: { data: data(), form: { error: 'Full name is required.' } } as never });
		expect(screen.getByText('Full name is required.')).toBeInTheDocument();
	});
});
