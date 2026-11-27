import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Layout from './+layout.svelte';
import { setPage } from '#test/mocks/app-state.svelte.ts';
import { snip } from '#test/helpers/component.ts';

function renderAt(path: string) {
	setPage({ url: path });
	return render(Layout, { props: { data: {}, children: snip('<p data-testid="children">child-content</p>') } as never });
}

describe('(patient) +layout', () => {
	it('shows bottom nav on regular pages', () => {
		renderAt('/home');
		expect(screen.getByTestId('children')).toBeInTheDocument();
		expect(screen.getByRole('navigation')).toBeInTheDocument();
	});

	it.each(['/doctors/abc/book', '/doctors/abc/book/confirm'])(
		'hides bottom nav on %s',
		(path) => {
			renderAt(path);
			expect(screen.queryByRole('navigation')).toBeNull();
		}
	);

	it('shows nav on doctor detail (no /book)', () => {
		renderAt('/doctors/abc');
		expect(screen.getByRole('navigation')).toBeInTheDocument();
	});
});
