import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('reset password page', () => {
	it('valid token shows form', () => {
		render(Page, { props: { data: { valid: true }, form: null } as never });
		expect(screen.getByText('Choose a new password for your account.')).toBeInTheDocument();
		expect(screen.getByLabelText('New Password')).toBeInTheDocument();
	});

	it('valid token with form error', () => {
		render(Page, {
			props: { data: { valid: true }, form: { error: 'Passwords do not match.', expired: false } } as never
		});
		expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
	});

	it('invalid token shows request link', () => {
		render(Page, { props: { data: { valid: false }, form: null } as never });
		expect(screen.getByRole('link', { name: 'Request New Link' })).toHaveAttribute('href', '/login/forgot');
	});

	it('switching between expired and valid after mount', async () => {
		const { rerender } = render(Page, { props: { data: { valid: true }, form: null } as never });
		await rerender({ data: { valid: true }, form: { error: 'x', expired: true } } as never);
		expect(await screen.findByRole('link', { name: 'Request New Link' })).toBeInTheDocument();
		await rerender({ data: { valid: true }, form: null } as never);
		expect(await screen.findByLabelText('New Password')).toBeInTheDocument();
	});

	it('expired via form', () => {
		render(Page, {
			props: { data: { valid: true }, form: { error: 'expired', expired: true } } as never
		});
		expect(screen.getByText(/invalid or has expired/)).toBeInTheDocument();
		expect(screen.queryByLabelText('New Password')).toBeNull();
	});
});
