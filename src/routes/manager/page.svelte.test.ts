import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setPage } from '../../test/mocks/app-state.svelte.ts';
import Page from './+page.svelte';

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		filters: { range: '30d', hospitalId: null, specialistId: null },
		filterOptions: {
			hospitals: [
				{ id: 'h1', name: 'Central Health' },
				{ id: 'h2', name: 'East Clinic' }
			],
			specialists: [
				{ id: 's1', name: 'Cardiology' },
				{ id: 's2', name: 'Dental' }
			]
		},
		rangeLabel: 'Last 30 days',
		totals: { hospitals: 4, doctors: 12, bookings: 57, pending: 8 },
		trend: { bookings: 25, pending: -10 },
		series: [
			{ date: '2026-10-01', total: 3 },
			{ date: '2026-10-02', total: 5 }
		],
		status: [
			{ status: 'pending', count: 8 },
			{ status: 'confirmed', count: 30 },
			{ status: 'completed', count: 15 },
			{ status: 'cancelled', count: 4 }
		],
		bySpecialty: [{ specialty: 'Cardiology', total: 33 }],
		topDoctors: [{ id: 'd1', name: 'Dr. Alice', specialty: 'Cardiology', total: 21 }],
		recent: [
			{
				id: 'b1',
				patient: 'Pat One',
				doctor: 'Dr. Alice',
				specialty: 'Cardiology',
				hospital: 'Central Health',
				date: '2026-10-20',
				time: '09:00',
				status: 'confirmed'
			},
			{
				id: 'b2',
				patient: 'Pat Two',
				doctor: 'Dr. Bob',
				specialty: 'Dental',
				hospital: 'East Clinic',
				date: '2026-10-21',
				time: '10:00',
				status: 'cancelled'
			}
		],
		...overrides
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPage = (data = makeData()) => render(Page, { props: { data } as any });

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('manager dashboard page', () => {
	it('renders header, stats and trend chips (up and down)', () => {
		renderPage();
		expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
		expect(screen.getByText(/Last 30 days · live overview/)).toBeInTheDocument();
		expect(screen.getAllByText('57').length).toBeGreaterThan(0);
		const up = screen.getByText('+25%');
		expect(up.className).toContain('text-primary');
		const down = screen.getByText('-10%');
		expect(down.className).toContain('text-error');
		expect(screen.getAllByTitle('vs previous period')).toHaveLength(2);
	});

	it('renders flat trend as +0%', () => {
		renderPage(makeData({ trend: { bookings: 0, pending: 0 } }));
		expect(screen.getAllByText('+0%')).toHaveLength(2);
	});

	it('hides trend chips for all-time range', () => {
		renderPage(
			makeData({
				filters: { range: 'all', hospitalId: 'h2', specialistId: 's1' },
				rangeLabel: 'All time',
				trend: { bookings: null, pending: null }
			})
		);
		expect(screen.queryByTitle('vs previous period')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Date range')).toHaveValue('all');
		expect(screen.getByLabelText('Hospital')).toHaveValue('h2');
		expect(screen.getByLabelText('Specialty')).toHaveValue('s1');
	});

	it('filter selectors default to "All" options', () => {
		renderPage();
		expect(screen.getByLabelText('Date range')).toHaveValue('30d');
		expect(screen.getByLabelText('Hospital')).toHaveValue('');
		expect(screen.getByLabelText('Specialty')).toHaveValue('');
		expect(within(screen.getByLabelText('Date range')).getAllByRole('option')).toHaveLength(5);
		expect(screen.getByRole('link', { name: 'Reset' })).toHaveAttribute('href', '/manager');
	});

	it('renders charts and recent bookings (table + mobile)', () => {
		renderPage();
		expect(screen.queryByText('No bookings in this range.')).not.toBeInTheDocument();
		expect(screen.getAllByText('Dr. Alice').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Pat One')).toHaveLength(2);
		expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Cancelled').length).toBeGreaterThan(0);
		expect(screen.getByRole('link', { name: /View all/ })).toHaveAttribute('href', '/manager/bookings');
	});

	it('renders zero-data states', () => {
		renderPage(
			makeData({
				totals: { hospitals: 0, doctors: 0, bookings: 0, pending: 0 },
				series: [],
				status: [],
				bySpecialty: [],
				topDoctors: [],
				recent: []
			})
		);
		expect(screen.getByText('No bookings in this range.')).toBeInTheDocument();
		expect(screen.getByText('No bookings to show.')).toBeInTheDocument();
		expect(screen.getAllByText('No data for the selected filters.')).toHaveLength(2);
	});

	it('exports CSV with current params and opens Google Sheets', async () => {
		vi.useFakeTimers();
		const open = vi.spyOn(window, 'open').mockImplementation(() => null);
		const clicks: string[] = [];
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
			clicks.push(this.getAttribute('href') ?? '');
		});
		setPage({ url: '/manager?range=7d&hospitalId=h1' });
		renderPage();
		await fireEvent.click(screen.getByRole('button', { name: /Export to Google Sheets/ }));
		expect(clicks).toEqual(['/manager/export.csv?range=7d&hospitalId=h1']);
		expect(screen.getByText(/CSV downloaded/)).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(300);
		expect(open).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/u/0/create', '_blank', 'noopener');
		await vi.advanceTimersByTimeAsync(8000);
		expect(screen.queryByText(/CSV downloaded/)).not.toBeInTheDocument();
	});
});

describe('manager dashboard page – nullish data and re-render', () => {
	it('tolerates nullish labels/ids and re-renders with fresh data', async () => {
		const data = makeData({
			filters: { range: undefined, hospitalId: 'h1', specialistId: 's1' },
			filterOptions: {
				hospitals: [{ id: null, name: 'No id hospital' }, { id: 'h1', name: 'Central Health' }],
				specialists: [{ id: null, name: 'No id specialty' }, { id: 's1', name: 'Cardiology' }]
			},
			rangeLabel: undefined,
			trend: { bookings: undefined, pending: 5 },
			recent: [
				{
					id: 'b9',
					patient: 'Pat Null',
					doctor: null,
					specialty: null,
					hospital: null,
					date: '2026-10-20',
					time: null,
					status: 'pending'
				}
			]
		});
		const { rerender } = renderPage(data);
		expect(screen.getAllByText('Pat Null')).toHaveLength(2);
		expect(screen.getByRole('option', { name: 'No id hospital' })).toHaveValue('');
		await rerender({ data: { ...structuredClone(data), rangeLabel: 'Last 7 days' } } as never);
		expect(screen.getByText(/Last 7 days · live overview/)).toBeInTheDocument();
		expect(screen.getByLabelText('Hospital')).toHaveValue('h1');
		expect(screen.getByLabelText('Specialty')).toHaveValue('s1');
	});
});
