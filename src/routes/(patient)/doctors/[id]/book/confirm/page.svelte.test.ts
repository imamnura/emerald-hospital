import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../../../../../test/mocks/app-forms.ts';
import { testUser } from '../../../../../../test/helpers-pages-public.ts';

function data(over: Record<string, unknown> = {}) {
	return {
		user: testUser,
		appointment: {
			date: '2999-01-01',
			time: '09:00',
			timeLabel: '09:00 AM',
			scheduleId: 'sch1',
			visitType: 'Initial Consultation'
		},
		doctor: {
			id: 'd1',
			name: 'Dr. Alice',
			imageUrl: 'https://img/a.png',
			role: 'Cardiologist',
			hospital: 'RSUD',
			fee: 120,
			locationLine2: 'Jl. 1, Purwakarta',
			...over
		}
	};
}

describe('book confirm page', () => {
	it('renders details and submits hidden fields', async () => {
		render(Page, { props: { data: data(), form: null } as never });
		expect(screen.getByAltText('Dr. Alice')).toBeInTheDocument();
		expect(screen.getByText('$120.00')).toBeInTheDocument();
		expect(screen.getByText(/at 09:00 AM/)).toBeInTheDocument();
		expect(screen.getByLabelText('Back')).toHaveAttribute('href', '/doctors/d1/book?date=2999-01-01');
		await fireEvent.submit(screen.getByRole('button', { name: /Confirm/ }).closest('form')!);
		expect(submissions[0].formData.get('scheduleId')).toBe('sch1');
		expect(submissions[0].formData.get('appointmentTime')).toBe('09:00');
	});

	it('renders error and initial avatar', () => {
		render(Page, {
			props: { data: data({ imageUrl: null }), form: { error: 'Selected slot is no longer available.' } } as never
		});
		expect(screen.getByText('Selected slot is no longer available.')).toBeInTheDocument();
		expect(screen.getByText('D')).toBeInTheDocument();
	});
});
