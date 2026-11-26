import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { submissions } from '#test/mocks/app-forms.ts';
import LogoutButton from './LogoutButton.svelte';

describe('LogoutButton', () => {
	it('defaults to "Logout" and posts ?/logout', async () => {
		render(LogoutButton);
		const button = screen.getByRole('button', { name: 'Logout' });
		await fireEvent.submit(button.closest('form')!);
		expect(submissions.at(-1)!.action.search).toBe('?/logout');
	});

	it('accepts a label and form classes', () => {
		render(LogoutButton, { label: 'Sign Out', class: 'mt-8 pb-4' });
		const button = screen.getByRole('button', { name: 'Sign Out' });
		expect(button.closest('form')).toHaveClass('mt-8', 'pb-4');
	});
});
