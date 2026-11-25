import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { setEnhanceResult, submissions, update } from '../../test/mocks/app-forms.ts';
import AppointmentCancelledModal from './AppointmentCancelledModal.svelte';
import AppointmentConfirmedModal from './AppointmentConfirmedModal.svelte';
import CancelAppointmentModal from './CancelAppointmentModal.svelte';

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

describe('CancelAppointmentModal', () => {
	const props = () => ({
		open: true,
		bookingId: 'bk-1',
		doctorName: 'Dr. Who',
		appointmentDate: '2024-12-01',
		onClose: vi.fn(),
		onCancelled: vi.fn()
	});

	it('renders nothing when closed', () => {
		render(CancelAppointmentModal, { ...props(), open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('renders details and keep/backdrop call onClose', async () => {
		const p = props();
		render(CancelAppointmentModal, p);
		expect(screen.getByRole('dialog', { name: 'Cancel Appointment?' })).toBeInTheDocument();
		expect(screen.getByText('Dr. Who')).toBeInTheDocument();
		expect(screen.getByText(/on Dec 1, 2024\?/)).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('dialog'));
		expect(p.onClose).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Keep Appointment' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		expect(p.onClose).toHaveBeenCalledTimes(2);
	});

	it('submits bookingId and calls onCancelled on success', async () => {
		const p = props();
		render(CancelAppointmentModal, p);
		await fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel Appointment' }));
		await vi.waitFor(() => expect(update).toHaveBeenCalled());
		expect(submissions).toHaveLength(1);
		expect(submissions[0].action.search).toBe('?/cancel');
		expect(submissions[0].formData.get('bookingId')).toBe('bk-1');
		expect(p.onCancelled).toHaveBeenCalledWith({
			doctorName: 'Dr. Who',
			appointmentDate: '2024-12-01'
		});
		expect(screen.getByRole('button', { name: 'Yes, Cancel Appointment' })).not.toBeDisabled();
	});

	it('does not call onCancelled on failure', async () => {
		setEnhanceResult({ type: 'failure', status: 400, data: { error: 'nope' } });
		const p = props();
		render(CancelAppointmentModal, p);
		await fireEvent.submit(screen.getByRole('button', { name: 'Yes, Cancel Appointment' }).closest('form')!);
		await vi.waitFor(() => expect(update).toHaveBeenCalled());
		expect(p.onCancelled).not.toHaveBeenCalled();
	});

	it('shows submitting state while the request is in flight', async () => {
		const p = props();
		render(CancelAppointmentModal, p);
		const submit = screen.getByRole('button', { name: 'Yes, Cancel Appointment' });
		const seen: string[] = [];
		const observer = new MutationObserver(() => {
			seen.push(`${submit.textContent?.trim()}|${(submit as HTMLButtonElement).disabled}`);
		});
		observer.observe(submit, { childList: true, subtree: true, characterData: true, attributes: true });
		await fireEvent.submit(submit.closest('form')!);
		await vi.waitFor(() => expect(update).toHaveBeenCalled());
		observer.disconnect();
		expect(seen).toContain('Cancelling…|true');
		expect(submit).toHaveTextContent('Yes, Cancel Appointment');
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

	it('CancelAppointmentModal removes the dialog when closed', async () => {
		const { rerender } = render(CancelAppointmentModal, {
			open: true,
			bookingId: 'b',
			doctorName: 'Dr. A',
			appointmentDate: '2024-01-01',
			onClose: vi.fn(),
			onCancelled: vi.fn()
		});
		await rerender({ open: false });
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
	});
});
