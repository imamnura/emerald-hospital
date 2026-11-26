import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '#test/mocks/app-forms.ts';

describe('change password page', () => {
	it('renders form and submits', async () => {
		render(Page, { props: { data: { hasPassword: true }, form: null } as never });
		expect(screen.queryByText('Password updated successfully.')).toBeNull();
		await fireEvent.input(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
		await fireEvent.submit(screen.getByRole('button', { name: 'Update Password' }).closest('form')!);
		expect(submissions[0].action.search).toBe('?/change');
		expect(submissions[0].formData.get('newPassword')).toBe('newpass123');
	});

	it('renders error', () => {
		render(Page, {
			props: { data: { hasPassword: true }, form: { error: 'New passwords do not match.' } } as never
		});
		expect(screen.getByText('New passwords do not match.')).toBeInTheDocument();
	});

	it('renders success', () => {
		render(Page, { props: { data: { hasPassword: true }, form: { success: true } } as never });
		expect(screen.getByText('Password updated successfully.')).toBeInTheDocument();
	});

	it('user with a password sees Change Password with the current-password field', () => {
		render(Page, { props: { data: { hasPassword: true }, form: null } as never });
		expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
		expect(screen.getByLabelText('Current Password')).toBeRequired();
		expect(screen.queryByText(/You signed up with Google/)).toBeNull();
		expect(screen.queryByRole('button', { name: 'Set Password' })).toBeNull();
	});

	it('Google-only user (no password) sets a password without the current-password field', async () => {
		render(Page, { props: { data: { hasPassword: false }, form: null } as never });
		expect(screen.getByRole('heading', { name: 'Set Password' })).toBeInTheDocument();
		expect(screen.queryByLabelText('Current Password')).toBeNull();
		expect(screen.getByText(/You signed up with Google/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Update Password' })).toBeNull();
		await fireEvent.input(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
		await fireEvent.input(screen.getByLabelText('Confirm New Password'), {
			target: { value: 'newpass123' }
		});
		await fireEvent.submit(screen.getByRole('button', { name: 'Set Password' }).closest('form')!);
		expect(submissions[0].action.search).toBe('?/change');
		expect(submissions[0].formData.has('currentPassword')).toBe(false);
		expect(submissions[0].formData.get('newPassword')).toBe('newpass123');
	});
});
