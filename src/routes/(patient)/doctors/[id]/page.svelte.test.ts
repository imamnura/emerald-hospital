import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

function doctor(over: Record<string, unknown> = {}) {
	return {
		id: 'd1',
		name: 'Dr. Alice',
		specialty: 'Cardiology',
		rating: '4.8',
		imageUrl: 'https://img/a.png',
		isOnline: true,
		hospital: 'RSUD Purwakarta',
		hospitalAddress: 'Jl. Raya 1',
		hospitalCity: 'Purwakarta',
		...over
	};
}

describe('doctor detail page', () => {
	it('renders doctor with image, online and schedules', () => {
		const { container } = render(Page, {
			props: {
				data: {
					doctor: doctor(),
					schedules: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', maxQuota: 10 }],
					scheduleDays: 'Monday'
				}
			} as never
		});
		expect(screen.getByAltText('Dr. Alice')).toBeInTheDocument();
		expect(container.querySelector('.bg-emerald-500')).not.toBeNull();
		expect(screen.getByText(/09:00 – 12:00 \(max 10\)/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Book Appointment' })).toHaveAttribute(
			'href',
			'/doctors/d1/book'
		);
	});

	it('renders initial, offline and empty schedules', () => {
		const { container } = render(Page, {
			props: {
				data: { doctor: doctor({ imageUrl: null, isOnline: false }), schedules: [], scheduleDays: '' }
			} as never
		});
		expect(screen.getByText('D')).toBeInTheDocument();
		expect(container.querySelector('.bg-emerald-500')).toBeNull();
		expect(screen.getByText('No schedule available.')).toBeInTheDocument();
	});

	it('tolerates missing optional fields', () => {
		render(Page, {
			props: {
				data: {
					doctor: doctor({
						id: undefined,
						rating: null,
						hospital: null,
						hospitalAddress: null,
						hospitalCity: null
					}),
					schedules: [{ dayOfWeek: 2, startTime: null, endTime: null, maxQuota: null }],
					scheduleDays: ''
				}
			} as never
		});
		expect(screen.getByRole('link', { name: 'Book Appointment' })).toHaveAttribute(
			'href',
			'/doctors//book'
		);
	});
});
