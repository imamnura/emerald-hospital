import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { submissions } from '../../test/mocks/app-forms.ts';
import { setPage } from '../../test/mocks/app-state.svelte.ts';
import Layout from './+layout.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Child content</p>' }));

const user = { id: 'u1', name: 'maria clara santos', email: 'maria@emerald.test', role: 'manager' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLayout = () => render(Layout, { props: { data: { user }, children } as any });

const desktopNav = () => screen.getByRole('navigation', { name: 'Manager navigation' });

beforeEach(() => {
	setPage({ url: '/manager' });
});

describe('manager layout', () => {
	it('renders children and user info with initials', () => {
		renderLayout();
		expect(screen.getByText('Child content')).toBeInTheDocument();
		expect(screen.getByText('MC')).toBeInTheDocument();
		expect(screen.getAllByText('maria clara santos')).toHaveLength(2);
		expect(screen.getByText('maria@emerald.test')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Patient app' })).toHaveAttribute('href', '/home');
	});

	it('marks Dashboard active only on exact /manager', () => {
		renderLayout();
		const nav = desktopNav();
		expect(within(nav).getByRole('link', { name: 'Dashboard' }).className).toContain('bg-primary');
		expect(within(nav).getByRole('link', { name: 'Doctors' }).className).not.toContain('bg-primary');
	});

	it.each([
		['/manager/doctors', 'Doctors'],
		['/manager/doctors/123', 'Doctors'],
		['/manager/bookings', 'Bookings']
	])('marks nav active for %s', (url, label) => {
		setPage({ url });
		renderLayout();
		const nav = desktopNav();
		expect(within(nav).getByRole('link', { name: label }).className).toContain('bg-primary');
		expect(within(nav).getByRole('link', { name: 'Dashboard' }).className).not.toContain('bg-primary');
	});

	it('does not treat prefix-similar paths as active', () => {
		setPage({ url: '/manager/doctorsx' });
		renderLayout();
		expect(within(desktopNav()).getByRole('link', { name: 'Doctors' }).className).not.toContain('bg-primary');
	});

	it('opens and closes mobile drawer via close button, backdrop and link click', async () => {
		const u = userEvent.setup();
		setPage({ url: '/manager/schedules' });
		renderLayout();
		expect(screen.queryByRole('button', { name: 'Close navigation' })).not.toBeInTheDocument();

		await u.click(screen.getByRole('button', { name: 'Open navigation' }));
		expect(screen.getByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: 'Schedules' })[1].className).toContain('bg-primary');
		expect(screen.getAllByRole('link', { name: 'Hospitals' })[1].className).not.toContain('bg-primary');
		await u.click(screen.getByRole('button', { name: 'Close' }));
		expect(screen.queryByRole('button', { name: 'Close navigation' })).not.toBeInTheDocument();

		await u.click(screen.getByRole('button', { name: 'Open navigation' }));
		await u.click(screen.getByRole('button', { name: 'Close navigation' }));
		expect(screen.queryByRole('button', { name: 'Close navigation' })).not.toBeInTheDocument();

		await u.click(screen.getByRole('button', { name: 'Open navigation' }));
		const drawerLink = screen.getAllByRole('link', { name: 'Hospitals' })[1];
		drawerLink.addEventListener('click', (e) => e.preventDefault());
		await fireEvent.click(drawerLink);
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Close navigation' })).not.toBeInTheDocument()
		);
	});

	it('sign-out forms post to /profile?/logout', async () => {
		const u = userEvent.setup();
		renderLayout();
		await u.click(screen.getByRole('button', { name: 'Sign out' }));
		await waitFor(() => expect(submissions).toHaveLength(1));
		expect(submissions[0].action.pathname).toBe('/profile');
		expect(submissions[0].action.search).toBe('?/logout');

		await u.click(screen.getByRole('button', { name: 'Open navigation' }));
		const drawerSignOut = screen.getAllByRole('button', { name: 'Sign out' })[1];
		await u.click(drawerSignOut);
		await waitFor(() => expect(submissions).toHaveLength(2));
	});
});
