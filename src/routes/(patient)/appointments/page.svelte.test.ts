import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { goto } from '../../../test/mocks/app-navigation.ts';
import { setEnhanceResult } from '../../../test/mocks/app-forms.ts';
import { testUser } from '../../../test/helpers-pages-public.ts';

const FUTURE = '2999-01-15';
const PAST = '2000-01-15';

function apt(over: Record<string, unknown> = {}) {
	return {
		id: 'a1',
		doctorId: 'd1',
		doctorName: 'Dr. Future',
		doctorImage: null,
		specialty: 'Cardiology',
		doctorRating: '4.9',
		hospital: 'RSUD',
		appointmentDate: FUTURE,
		appointmentTime: '09:00',
		status: 'confirmed',
		...over
	};
}

function renderPage(data: Record<string, unknown>) {
	return render(Page, {
		props: { data: { user: testUser, appointments: [], confirmedBooking: null, ...data } } as never
	});
}

describe('appointments page', () => {
	it('empty upcoming and past states, guest header', async () => {
		render(Page, { props: { data: { user: null, appointments: [], confirmedBooking: null } } as never });
		expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Find a Doctor' })).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Past' }));
		expect(await screen.findByText('No past appointments')).toBeInTheDocument();
		expect(screen.getByText(/completed visits will appear/)).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Find a Doctor' })).toBeNull();
	});

	it('lists upcoming and past, cancels successfully, then books new', async () => {
		renderPage({
			appointments: [
				apt(),
				apt({ id: 'a2', doctorName: 'Dr. Past', appointmentDate: PAST, status: 'completed', doctorRating: null })
			]
		});
		expect(screen.getByText('Dr. Future')).toBeInTheDocument();
		expect(screen.queryByText('Dr. Past')).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(await screen.findByText(/Are you sure you want to cancel/)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Keep Appointment' }));
		await waitFor(() => expect(screen.queryByText(/Are you sure you want to cancel/)).toBeNull());

		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		setEnhanceResult({ type: 'success', status: 200, data: { success: true } });
		await fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel Appointment' }));
		expect(await screen.findByText('Appointment Cancelled')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Book a New Appointment' }));
		expect(goto).toHaveBeenCalledWith('/home');

		await fireEvent.click(screen.getByRole('button', { name: 'Past' }));
		expect(await screen.findByText('Dr. Past')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Upcoming' }));
		expect(await screen.findByText('Dr. Future')).toBeInTheDocument();
	});

	it('cancelled success modal back to appointments', async () => {
		renderPage({ appointments: [apt()] });
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(await screen.findByRole('button', { name: 'Yes, Cancel Appointment' }));
		await fireEvent.click(await screen.findByRole('button', { name: 'Back to Appointments' }));
		await waitFor(() => expect(screen.queryByText('Appointment Cancelled')).toBeNull());
	});

	it('confirmed booking modal closes and navigates', async () => {
		renderPage({ appointments: [apt()], confirmedBooking: apt() });
		const btn = await screen.findByRole('button', { name: 'View My Appointments' });
		await fireEvent.click(btn);
		expect(goto).toHaveBeenCalledWith('/appointments', { replace: true, reset: false });
	});
});
