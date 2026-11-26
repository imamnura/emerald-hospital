import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { setPage } from '../../../test/mocks/app-state.svelte.ts';
import BottomNav from './BottomNav.svelte';

describe('BottomNav', () => {
	it('marks the current route as active', () => {
		setPage({ url: '/appointments' });
		render(BottomNav);
		const links = screen.getAllByRole('link');
		expect(links.map((l) => l.getAttribute('href'))).toEqual(['/home', '/appointments', '/profile']);
		expect(screen.getByText('Appointments')).toHaveClass('text-primary');
		expect(screen.getByText('Home')).toHaveClass('text-outline');
		expect(links[1].querySelector('span')).toHaveClass('bg-primary');
		expect(links[0].querySelector('span')).not.toHaveClass('bg-primary');
	});
});
