import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('forgot password page', () => {
	it('renders form without error', () => {
		render(Page, { props: { data: {}, form: null } as never });
		expect(screen.getByText(/Enter your email address/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
	});

	it('renders form error', () => {
		render(Page, { props: { data: {}, form: { error: 'Email address is required.' } } as never });
		expect(screen.getByText('Email address is required.')).toBeInTheDocument();
	});

	it('renders sent state', () => {
		render(Page, { props: { data: {}, form: { success: true, email: 'a@b.com' } } as never });
		expect(screen.getByText('a@b.com')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Send Reset Link' })).toBeNull();
	});
});
