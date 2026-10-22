import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { testUser } from '../../../test/helpers-pages-public.ts';

describe('specialists page', () => {
	it('renders grid', () => {
		render(Page, {
			props: {
				data: {
					user: testUser,
					specialists: [{ id: 's1', name: 'Cardiology', slug: 'cardiology', icon: 'heart' }]
				}
			} as never
		});
		expect(screen.getByText('Cardiology')).toBeInTheDocument();
		expect(screen.queryByText('No specialists available yet.')).toBeNull();
	});

	it('renders empty state for guest', () => {
		render(Page, { props: { data: { user: null, specialists: [] } } as never });
		expect(screen.getByText('No specialists available yet.')).toBeInTheDocument();
	});
});
