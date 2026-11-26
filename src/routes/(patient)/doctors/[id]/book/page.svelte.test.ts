import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { goto } from '#test/mocks/app-navigation.ts';
import { testUser } from '#test/helpers/component.ts';

const calendarDays = [
	{ date: '2999-01-01', dayLabel: 'MON', dayNum: 1, available: true, isPast: false },
	{ date: '2999-01-02', dayLabel: 'TUE', dayNum: 2, available: true, isPast: false },
	{ date: '2999-01-03', dayLabel: 'WED', dayNum: 3, available: false, isPast: false },
	{ date: '2000-01-04', dayLabel: 'THU', dayNum: 4, available: true, isPast: true }
];

const slot = (time: string, over: Record<string, unknown> = {}) => ({
	time,
	label: `L-${time}`,
	quota: 3,
	scheduleId: 'sch1',
	period: Number(time.slice(0, 2)) < 12 ? 'morning' : 'afternoon',
	isFull: false,
	...over
});

function data(over: Record<string, unknown> = {}) {
	return {
		user: testUser,
		doctor: {
			id: 'd1',
			name: 'Dr. Alice',
			specialistSlug: 'cardiology',
			imageUrl: 'https://img/a.png',
			role: 'Senior Cardiologist',
			rating: '4.8',
			reviewCount: 10,
			bio: 'Bio text'
		},
		schedules: [],
		calendarDays,
		selectedDate: '2999-01-01',
		slots: [
			slot('09:00'),
			slot('10:00', { isFull: true }),
			slot('14:00'),
			slot('15:00', { isFull: true })
		],
		availableDays: [1, 2],
		monthLabel: 'January 2999',
		...over
	};
}

function bookBtn() {
	return screen.getByRole('button', { name: /Book Appointment/ });
}

describe('book page', () => {
	it('renders hero with image, slots, FULL badges and back link', () => {
		render(Page, { props: { data: data() } as never });
		expect(screen.getByAltText('Dr. Alice')).toBeInTheDocument();
		expect(screen.getByLabelText('Back')).toHaveAttribute('href', '/specialists/cardiology');
		expect(screen.getByText('Morning')).toBeInTheDocument();
		expect(screen.getByText('Afternoon')).toBeInTheDocument();
		expect(screen.getAllByText('FULL')).toHaveLength(2);
		expect(screen.getByRole('button', { name: /WED/ })).toBeDisabled();
		expect(screen.getByRole('button', { name: /THU/ })).toBeDisabled();
		expect(bookBtn()).toBeDisabled();
	});

	it('select date navigates and picks slots; logged-in goes to confirm', async () => {
		render(Page, { props: { data: data() } as never });
		await fireEvent.click(screen.getByRole('button', { name: /TUE/ }));
		expect(goto).toHaveBeenCalledWith('/doctors/d1/book?date=2999-01-02', {
			replace: true,
			reset: false
		});
		await fireEvent.click(screen.getByRole('button', { name: 'L-09:00' }));
		await fireEvent.click(screen.getByRole('button', { name: 'L-14:00' }));
		expect(bookBtn()).toBeEnabled();
		await fireEvent.click(bookBtn());
		const q = new URLSearchParams({ date: '2999-01-02', time: '14:00', scheduleId: 'sch1' });
		expect(goto).toHaveBeenLastCalledWith(`/doctors/d1/book/confirm?${q}`);
	});

	it('guest is redirected to login', async () => {
		render(Page, { props: { data: data({ user: null }) } as never });
		await fireEvent.click(screen.getByRole('button', { name: 'L-09:00' }));
		await fireEvent.click(bookBtn());
		const q = new URLSearchParams({ date: '2999-01-01', time: '09:00', scheduleId: 'sch1' });
		expect(goto).toHaveBeenLastCalledWith(
			`/login?redirect=${encodeURIComponent(`/doctors/d1/book/confirm?${q}`)}`
		);
	});

	it('clicking a full slot does nothing', async () => {
		render(Page, { props: { data: data() } as never });
		const full = screen.getByRole('button', { name: /L-10:00/ });
		full.removeAttribute('disabled');
		await fireEvent.click(full);
		expect(bookBtn()).toBeDisabled();
	});

	it('no slots for date, initial avatar', () => {
		render(Page, {
			props: {
				data: data({ slots: [], doctor: { ...data().doctor, imageUrl: null } })
			} as never
		});
		expect(screen.getByText('No time slots for this date.')).toBeInTheDocument();
		expect(screen.getByText('D')).toBeInTheDocument();
	});

	it('only morning / only afternoon groups', () => {
		const { unmount } = render(Page, { props: { data: data({ slots: [slot('09:00')] }) } as never });
		expect(screen.queryByText('Afternoon')).toBeNull();
		unmount();
		render(Page, { props: { data: data({ slots: [slot('15:00')] }) } as never });
		expect(screen.queryByText('Morning')).toBeNull();
	});

	it('tolerates missing labels', () => {
		render(Page, {
			props: {
				data: data({
					monthLabel: null,
					doctor: { ...data().doctor, reviewCount: null },
					slots: [slot('09:00', { label: null }), slot('14:00', { label: null })]
				})
			} as never
		});
		expect(screen.getByText('Morning')).toBeInTheDocument();
	});

	it('no selected date hides time section', () => {
		render(Page, { props: { data: data({ selectedDate: '', slots: [] }) } as never });
		expect(screen.queryByText('Available Time')).toBeNull();
	});
});
