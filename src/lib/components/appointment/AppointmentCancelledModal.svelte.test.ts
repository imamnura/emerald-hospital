import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import AppointmentCancelledModal from './AppointmentCancelledModal.svelte';

describe('AppointmentCancelledModal', () => {
	const props = () => ({
		open: true,
		doctorName: 'Dr. Smith',
		appointmentDate: '2024-10-17',
		onBackToAppointments: vi.fn(),
		onBookNew: vi.fn()
	});

	it('renders nothing when closed', () => {
		render(AppointmentCancelledModal, { ...props(), open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders details and wires buttons', async () => {
		const p = props();
		render(AppointmentCancelledModal, p);
		expect(screen.getByRole('dialog', { name: 'Appointment Cancelled' })).toBeInTheDocument();
		expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
		expect(screen.getByText('Oct 17, 2024')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Back to Appointments' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Book a New Appointment' }));
		// The corner close button also closes the dialog itself, so it goes last.
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(p.onBackToAppointments).toHaveBeenCalledTimes(2);
		expect(p.onBookNew).toHaveBeenCalledTimes(1);
	});

	it('backdrop click closes but clicks inside the dialog do not', async () => {
		const p = props();
		render(AppointmentCancelledModal, p);
		await fireEvent.click(screen.getByRole('dialog'));
		expect(p.onBackToAppointments).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		expect(p.onBackToAppointments).toHaveBeenCalledTimes(1);
	});
});

describe('modal outro transitions', () => {
	it('AppointmentCancelledModal removes the dialog when closed', async () => {
		const { rerender } = render(AppointmentCancelledModal, {
			open: true,
			doctorName: 'Dr. A',
			appointmentDate: '2024-01-01',
			onBackToAppointments: vi.fn(),
			onBookNew: vi.fn()
		});
		await rerender({ open: false });
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});
