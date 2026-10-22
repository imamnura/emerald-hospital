import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

const rec = (over: Record<string, unknown> = {}) => ({
	id: 'r1',
	title: 'Blood Panel',
	facility: 'RSUD',
	type: 'lab',
	recordDate: '2024-05-02',
	dateLabel: 'May 2, 2024',
	monthKey: '2024-05',
	monthLabel: 'May 2024',
	categoryLabel: 'Lab Result',
	fileUrl: null,
	...over
});

const user = { name: 'Jane', imageUrl: null };

describe('medical records page', () => {
	it('empty state without query', () => {
		render(Page, { props: { data: { user, records: [] } } as never });
		expect(screen.getByText('No medical records on file yet.')).toBeInTheDocument();
	});

	it('groups by month and filters by search', async () => {
		render(Page, {
			props: {
				data: {
					user,
					records: [
						rec(),
						rec({ id: 'r2', title: 'Chest X-Ray', type: 'imaging', monthKey: '2024-04', monthLabel: 'April 2024' })
					]
				}
			} as never
		});
		expect(screen.getByText('May 2024')).toBeInTheDocument();
		expect(screen.getByText('April 2024')).toBeInTheDocument();
		const search = screen.getByPlaceholderText('Search reports, labs...');
		await fireEvent.input(search, { target: { value: 'x-ray' } });
		expect(screen.queryByText('Blood Panel')).toBeNull();
		expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
		await fireEvent.input(search, { target: { value: 'nothing-here' } });
		expect(screen.getByText('No records match your search.')).toBeInTheDocument();
	});
});
