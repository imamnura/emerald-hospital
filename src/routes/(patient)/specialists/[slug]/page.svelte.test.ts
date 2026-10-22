import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const specialist = { id: 's1', name: 'Cardiology', slug: 'cardiology', icon: null };

describe('specialist detail page', () => {
	it('lists doctors', () => {
		render(Page, {
			props: {
				data: {
					user: null,
					specialist,
					doctors: [
						{
							id: 'd1',
							name: 'Dr. Alice',
							imageUrl: null,
							rating: '4.9',
							reviewCount: 5,
							hospital: 'RSUD',
							isOnline: true
						}
					]
				}
			} as never
		});
		expect(screen.getByText('Dr. Alice')).toBeInTheDocument();
		expect(screen.queryByText(/No doctors available/)).toBeNull();
	});

	it('empty state', () => {
		render(Page, { props: { data: { user: null, specialist, doctors: [] } } as never });
		expect(screen.getByText('No doctors available for this specialty yet.')).toBeInTheDocument();
	});
});
