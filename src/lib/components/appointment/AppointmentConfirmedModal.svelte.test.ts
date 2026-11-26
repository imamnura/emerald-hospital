import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import AppointmentConfirmedModal from './AppointmentConfirmedModal.svelte';

describe('AppointmentConfirmedModal', () => {
	const props = () => ({
		open: true,
		doctorName: 'Dr. Lee',
		appointmentDate: '2024-03-09',
		appointmentTime: '14:30',
		onClose: vi.fn()
	});

	it('renders nothing when closed', () => {
		render(AppointmentConfirmedModal, { ...props(), open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders date and time labels and closes', async () => {
		const p = props();
		render(AppointmentConfirmedModal, p);
		expect(screen.getByRole('dialog', { name: 'Appointment Confirmed!' })).toBeInTheDocument();
		expect(screen.getByText('Dr. Lee')).toBeInTheDocument();
		expect(screen.getByText('Mar 9, 2024')).toBeInTheDocument();
		expect(screen.getByText('02:30 PM')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('dialog'));
		expect(p.onClose).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'View My Appointments' }));
		const home = screen.getByRole('link', { name: 'Back to Home' });
		expect(home).toHaveAttribute('href', '/home');
		home.addEventListener('click', (e) => e.preventDefault());
		await fireEvent.click(home);
		await fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		expect(p.onClose).toHaveBeenCalledTimes(3);
	});
});

describe('modal outro transitions', () => {
	it('AppointmentConfirmedModal removes the dialog when closed', async () => {
		const { rerender } = render(AppointmentConfirmedModal, {
			open: true,
			doctorName: 'Dr. A',
			appointmentDate: '2024-01-01',
			appointmentTime: '00:05',
			onClose: vi.fn()
		});
		expect(screen.getByText('12:05 AM')).toBeInTheDocument();
		await rerender({ open: false });
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});
