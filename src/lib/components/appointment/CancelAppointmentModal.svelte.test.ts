import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { setEnhanceResult, submissions, update } from '#test/mocks/app-forms.ts';
import CancelAppointmentModal from './CancelAppointmentModal.svelte';

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
