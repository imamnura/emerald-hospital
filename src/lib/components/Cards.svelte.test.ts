import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../test/helpers-components.ts';
import AppointmentCard from './AppointmentCard.svelte';
import DoctorCard from './DoctorCard.svelte';
import HelpContactCard from './HelpContactCard.svelte';
import ProfileMenuItem from './ProfileMenuItem.svelte';
import SearchResultCard from './SearchResultCard.svelte';
import SpecialistChip from './SpecialistChip.svelte';
import SpecialistDoctorCard from './SpecialistDoctorCard.svelte';
import SpecialistGridCard from './SpecialistGridCard.svelte';

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
		expect(container.querySelector('article')!.getAttribute('style')).toContain('0s');
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

describe('DoctorCard', () => {
	it('renders defaults with initial and offline indicator', () => {
		const { container } = render(DoctorCard, {
			id: 'd2',
			name: 'Alice',
			specialty: 'Dental',
			hospital: 'Dental Clinic'
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/d2');
		expect(screen.getByText('A')).toBeInTheDocument();
		expect(screen.getByText('4.5')).toBeInTheDocument();
		expect(container.querySelector('.bg-outline-variant')).toBeInTheDocument();
	});

	it('renders image, rating and online indicator', () => {
		const { container } = render(DoctorCard, {
			id: 'd3',
			name: 'Bob',
			specialty: 'ENT',
			hospital: 'H',
			imageUrl: '/b.png',
			rating: '4.9',
			isOnline: true
		});
		expect(screen.getByRole('img', { name: 'Bob' })).toBeInTheDocument();
		expect(screen.getByText('4.9')).toBeInTheDocument();
		expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
	});
});

describe('HelpContactCard', () => {
	it('renders and calls onclick', async () => {
		const onclick = vi.fn();
		render(HelpContactCard, {
			title: 'Call us',
			description: '24/7 support',
			onclick,
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByText('24/7 support')).toBeInTheDocument();
		expect(screen.getByTestId('ic')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Call us/ }));
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});

describe('ProfileMenuItem', () => {
	it('renders link with label and icon', () => {
		render(ProfileMenuItem, {
			href: '/profile/edit',
			label: 'Edit Profile',
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByRole('link', { name: /Edit Profile/ })).toHaveAttribute(
			'href',
			'/profile/edit'
		);
		expect(screen.getByTestId('ic')).toBeInTheDocument();
	});
});

describe('SearchResultCard', () => {
	it('renders defaults and bookmark button calls onBookmark', async () => {
		const onBookmark = vi.fn();
		const { container } = render(SearchResultCard, {
			id: 'd9',
			name: 'Carol',
			specialty: 'Neurology',
			hospital: 'Brain Center',
			onBookmark
		});
		expect(screen.getByText('C')).toBeInTheDocument();
		expect(screen.getByText('(120)')).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/d9');
		const btn = screen.getByRole('button', { name: 'Bookmark doctor' });
		expect(container.querySelector('.fill-primary.lucide-bookmark')).toBeNull();
		await fireEvent.click(btn);
		expect(onBookmark).toHaveBeenCalledWith('d9');
	});

	it('renders bookmarked state with image and tolerates missing callback', async () => {
		const { container } = render(SearchResultCard, {
			id: 'd8',
			name: 'Dan',
			specialty: 'ENT',
			hospital: 'H',
			imageUrl: '/d.png',
			rating: '4.7',
			reviewCount: 5,
			bookmarked: true
		});
		expect(screen.getByRole('img', { name: 'Dan' })).toBeInTheDocument();
		expect(screen.getByText('(5)')).toBeInTheDocument();
		expect(container.querySelector('.lucide-bookmark')).toHaveClass('fill-primary');
		await fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }));
	});
});

describe('SpecialistChip', () => {
	it('renders inactive default chip', () => {
		const { container } = render(SpecialistChip, { name: 'General' });
		expect(screen.getByRole('link')).toHaveAttribute('href', '#');
		expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
		expect(screen.getByText('General')).toHaveClass('text-on-surface-variant');
	});

	it('renders active chip with icon and href', () => {
		const { container } = render(SpecialistChip, {
			name: 'Cardio',
			icon: 'heart',
			active: true,
			href: '/specialists/cardio'
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/specialists/cardio');
		expect(container.querySelector('.lucide-heart')).toBeInTheDocument();
		expect(container.querySelector('.bg-primary')).toBeInTheDocument();
		expect(screen.getByText('Cardio')).toHaveClass('text-on-surface');
	});
});

describe('SpecialistDoctorCard', () => {
	it('renders defaults with initial and links', () => {
		render(SpecialistDoctorCard, { id: 'x1', name: 'Eve', role: 'Dentist', hospital: 'H1' });
		expect(screen.getByText('E')).toBeInTheDocument();
		expect(screen.getByText('4.5')).toBeInTheDocument();
		expect(screen.getByText('(120 Reviews)')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'View Profile' })).toHaveAttribute('href', '/doctors/x1');
		expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', '/doctors/x1/book');
	});

	it('renders image and custom rating', () => {
		render(SpecialistDoctorCard, {
			id: 'x2',
			name: 'Fay',
			role: 'Dentist',
			hospital: 'H1',
			imageUrl: '/f.png',
			rating: '5.0',
			reviewCount: 3
		});
		expect(screen.getByRole('img', { name: 'Fay' })).toBeInTheDocument();
		expect(screen.getByText('(3 Reviews)')).toBeInTheDocument();
	});
});

describe('SpecialistGridCard', () => {
	it('renders link to specialist with default icon', () => {
		const { container } = render(SpecialistGridCard, { name: 'General', slug: 'general' });
		expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute(
			'href',
			'/specialists/general'
		);
		expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
	});

	it('renders resolved icon', () => {
		const { container } = render(SpecialistGridCard, { name: 'Eye', slug: 'eye', icon: 'eye' });
		expect(container.querySelector('.lucide-eye')).toBeInTheDocument();
	});
});

// Data coming from the API may contain nulls despite the declared types; the
// cards must still render (Svelte falls back to empty strings in templates).
describe('cards with nullish API fields', () => {
	const nil = null as unknown as string;

	it('DoctorCard', () => {
		render(DoctorCard, { id: nil, name: 'N', specialty: 'S', hospital: 'H', rating: nil });
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/');
	});

	it('SearchResultCard', () => {
		render(SearchResultCard, {
			id: nil,
			name: 'N',
			specialty: 'S',
			hospital: 'H',
			rating: nil,
			reviewCount: null as unknown as number
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/');
		expect(screen.getByText('()')).toBeInTheDocument();
	});

	it('SpecialistDoctorCard', () => {
		render(SpecialistDoctorCard, {
			id: nil,
			name: 'N',
			role: 'R',
			hospital: 'H',
			rating: nil,
			reviewCount: null as unknown as number
		});
		expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', '/doctors//book');
		expect(screen.getByText('( Reviews)')).toBeInTheDocument();
	});

	it('SpecialistGridCard', () => {
		render(SpecialistGridCard, { name: 'N', slug: nil, icon: null });
		expect(screen.getByRole('link')).toHaveAttribute('href', '/specialists/');
	});

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
