import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../test/mocks/app-forms.ts';

function data(over: Record<string, unknown> = {}) {
	return { redirectTo: null, errorMsg: null, resetSuccess: false, googleEnabled: false, ...over };
}

describe('login page', () => {
	it('renders disabled google button and no messages by default', () => {
		const { container } = render(Page, { props: { data: data(), form: null } as never });
		expect(screen.getByRole('button', { name: /not configured/ })).toBeDisabled();
		expect(container.querySelector('input[name="redirect"]')).toBeNull();
		expect(screen.queryByText(/password has been reset/)).toBeNull();
	});

	it('shows google link with redirect and hidden redirect field', () => {
		const { container } = render(Page, {
			props: { data: data({ googleEnabled: true, redirectTo: '/doctors/1/book' }), form: null } as never
		});
		expect(screen.getByRole('link', { name: /Sign in with Google/ })).toHaveAttribute(
			'href',
			`/login/google?redirect=${encodeURIComponent('/doctors/1/book')}`
		);
		expect(container.querySelector('input[name="redirect"]')).toHaveValue('/doctors/1/book');
	});

	it('shows google link without redirect', () => {
		render(Page, { props: { data: data({ googleEnabled: true }), form: null } as never });
		expect(screen.getByRole('link', { name: /Sign in with Google/ })).toHaveAttribute(
			'href',
			'/login/google'
		);
	});

	it('toggling googleEnabled after mount swaps button and link', async () => {
		const { rerender } = render(Page, { props: { data: data({ googleEnabled: true }), form: null } as never });
		await rerender({ data: data({ googleEnabled: false }), form: null } as never);
		expect(await screen.findByRole('button', { name: /not configured/ })).toBeInTheDocument();
		await rerender({ data: data({ googleEnabled: true }), form: null } as never);
		expect(await screen.findByRole('link', { name: /Sign in with Google/ })).toBeInTheDocument();
	});

	it('form error takes precedence', () => {
		render(Page, {
			props: { data: data({ errorMsg: 'url error' }), form: { error: 'Invalid email or password.' } } as never
		});
		expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
		expect(screen.queryByText('url error')).toBeNull();
	});

	it('shows url errorMsg', () => {
		render(Page, { props: { data: data({ errorMsg: 'url error', resetSuccess: true }), form: null } as never });
		expect(screen.getByText('url error')).toBeInTheDocument();
	});

	it('shows reset success', () => {
		render(Page, { props: { data: data({ resetSuccess: true }), form: null } as never });
		expect(screen.getByText(/password has been reset/)).toBeInTheDocument();
	});

	it('submits via enhance', async () => {
		render(Page, { props: { data: data(), form: null } as never });
		await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
		await fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
		await fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!);
		expect(submissions).toHaveLength(1);
		expect(submissions[0].formData.get('email')).toBe('a@b.com');
	});
});
