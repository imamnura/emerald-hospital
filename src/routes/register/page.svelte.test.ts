import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('register page', () => {
	it('google disabled, toggles password visibility', async () => {
		render(Page, { props: { data: { googleEnabled: false }, form: null } as never });
		expect(screen.getByRole('button', { name: /not configured/ })).toBeDisabled();
		const pw = screen.getByLabelText('Password');
		expect(pw).toHaveAttribute('type', 'password');
		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
		expect(pw).toHaveAttribute('type', 'text');
		await fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
		expect(pw).toHaveAttribute('type', 'password');
	});

	it('google enabled with form error', () => {
		render(Page, {
			props: { data: { googleEnabled: true }, form: { error: 'Email already registered.' } } as never
		});
		expect(screen.getByRole('link', { name: /Sign up with Google/ })).toHaveAttribute('href', '/login/google');
		expect(screen.getByText('Email already registered.')).toBeInTheDocument();
	});
});
