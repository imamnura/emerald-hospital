import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import GoogleAuthButton from './GoogleAuthButton.svelte';

describe('GoogleAuthButton', () => {
	it('is a link with the Google logo when enabled', () => {
		const { container } = render(GoogleAuthButton, {
			href: '/login/google',
			enabled: true,
			label: 'Sign in with Google'
		});
		const link = screen.getByRole('link', { name: 'Sign in with Google' });
		expect(link).toHaveAttribute('href', '/login/google');
		expect(link).toHaveAttribute('data-sveltekit-preload-data', 'off');
		expect(container.querySelectorAll('svg path')).toHaveLength(4);
	});

	it('is disabled with a hint when not configured', () => {
		render(GoogleAuthButton, { href: '/login/google', enabled: false, label: 'Sign up with Google' });
		const button = screen.getByRole('button', { name: 'Sign up with Google (not configured)' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute(
			'title',
			'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable'
		);
		expect(screen.queryByRole('link')).toBeNull();
	});

	it('merges extra classes, with enabledClass only on the link', () => {
		const { unmount } = render(GoogleAuthButton, {
			href: '/x',
			enabled: true,
			label: 'Go',
			class: 'mt-6',
			enabledClass: 'shadow-x'
		});
		expect(screen.getByRole('link')).toHaveClass('mt-6', 'w-full', 'shadow-x');
		unmount();
		render(GoogleAuthButton, {
			href: '/x',
			enabled: false,
			label: 'Go',
			class: 'mt-6',
			enabledClass: 'shadow-x'
		});
		expect(screen.getByRole('button')).toHaveClass('mt-6');
		expect(screen.getByRole('button')).not.toHaveClass('shadow-x');
	});
});
