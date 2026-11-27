import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import AppointmentCard from './AppointmentCard.svelte';

describe('AppointmentCard', () => {
	const base = {
		doctorId: 'd1',
		doctorName: 'Dr. Jane Foster',
		doctorImage: null,
		specialty: 'Cardiology',
		rating: '4.9',
		hospital: 'City Hospital',
		appointmentDate: '2024-10-17',
		appointmentTime: '09:15',
		status: 'confirmed'
	};

	it('renders confirmed card with initials, role, actions and cancel callback', async () => {
		const onCancel = vi.fn();
		const { container } = render(AppointmentCard, { ...base, onCancel, index: 2 });
		expect(screen.getByText('JF')).toBeInTheDocument();
		expect(screen.getByText('Senior Cardiologist')).toBeInTheDocument();
		expect(screen.getByText('Thu, Oct 17 • 09:15 AM')).toBeInTheDocument();
		expect(screen.getByText('City Hospital')).toBeInTheDocument();
		expect(screen.getByText('Confirmed')).toBeInTheDocument();
		expect(container.querySelector('.lucide-check')).toBeInTheDocument();
		expect(container.querySelector('article')!.getAttribute('style')).toContain('0.14');
		expect(screen.getByRole('link', { name: 'Reschedule' })).toHaveAttribute(
			'href',
			'/doctors/d1/book'
		);
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('renders pending card with image, clock icon and tolerates missing onCancel', async () => {
		const { container } = render(AppointmentCard, {
			...base,
			doctorImage: '/img.png',
			status: 'pending',
			rating: '4.0'
		});
		expect(screen.getByRole('img', { name: 'Dr. Jane Foster' })).toHaveAttribute('src', '/img.png');
		expect(screen.getByText('Cardiologist')).toBeInTheDocument();
		expect(container.querySelector('.lucide-clock')).toBeInTheDocument();
		// Default index 0 means no entrance delay. Check the value, not the serialization:
		// jsdom 31 drops the default `0s` delay from the `animation` shorthand.
		const style = container.querySelector('article')!.getAttribute('style')!;
		// Guard against a vacuous pass: an invalid delay (e.g. `NaNs`) makes jsdom drop the
		// whole declaration, leaving no time values to check.
		expect(style).toContain('card-enter');
		const delays = (style.match(/\d*\.?\d+s\b/g) ?? []).filter((t) => t !== '0.45s');
		expect(delays.every((t) => parseFloat(t) === 0)).toBe(true);
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
	});

	it('hides actions for completed status and shows no status icon', () => {
		const { container } = render(AppointmentCard, { ...base, status: 'completed' });
		expect(screen.getByText('Completed')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
		expect(container.querySelector('.lucide-check')).toBeNull();
		expect(container.querySelector('.lucide-clock')).toBeNull();
	});

	it('hides actions when showActions is false', () => {
		render(AppointmentCard, { ...base, showActions: false });
		expect(screen.queryByRole('link', { name: 'Reschedule' })).toBeNull();
	});
});

// Data coming from the API may contain nulls despite the declared types; the
// cards must still render (Svelte falls back to empty strings in templates).
describe('cards with nullish API fields', () => {
	const nil = null as unknown as string;

	it('AppointmentCard', () => {
		render(AppointmentCard, {
			doctorId: nil,
			doctorName: 'Dr. N',
			doctorImage: null,
			specialty: 'General',
			rating: '4',
			hospital: 'H',
			appointmentDate: '2024-01-01',
			appointmentTime: '12:00',
			status: 'pending'
		});
		expect(screen.getByRole('link', { name: 'Reschedule' })).toHaveAttribute('href', '/doctors//book');
	});
});
