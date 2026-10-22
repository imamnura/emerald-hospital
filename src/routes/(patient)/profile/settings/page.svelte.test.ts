import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../../../test/mocks/app-forms.ts';

function renderPage(push: boolean, email: boolean) {
	return render(Page, {
		props: {
			data: {
				preferences: { pushNotifications: push, emailNotifications: email, language: 'en' },
				languageLabel: 'English'
			}
		} as never
	});
}

describe('account settings page', () => {
	it('renders links and submits toggles and logout', async () => {
		renderPage(true, false);
		expect(screen.getByRole('link', { name: /Change Password/ })).toHaveAttribute(
			'href',
			'/profile/settings/password'
		);
		expect(screen.getByText('English')).toBeInTheDocument();
		await fireEvent.submit(screen.getAllByText('Push Notifications')[0].closest('form')!);
		await fireEvent.submit(screen.getAllByText('Email Notifications')[0].closest('form')!);
		await fireEvent.submit(screen.getByRole('button', { name: /Sign Out/ }).closest('form')!);
		expect(submissions.map((s) => s.action.search)).toEqual([
			'?/togglePush',
			'?/toggleEmail',
			'?/logout'
		]);
	});

	it('renders inverse toggle states', () => {
		renderPage(false, true);
		expect(screen.getAllByText('Email Notifications')[0]).toBeInTheDocument();
	});
});
