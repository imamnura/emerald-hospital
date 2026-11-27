import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import DoctorSummary from './DoctorSummary.svelte';

const nil = null as unknown as string;

describe('DoctorSummary compact', () => {
	it('renders defaults with initial and offline indicator', () => {
		const { container } = render(DoctorSummary, {
			variant: 'compact',
			doctor: { id: 'd2', name: 'Alice', specialty: 'Dental', hospital: 'Dental Clinic' }
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/d2');
		expect(screen.getByText('A')).toBeInTheDocument();
		expect(screen.getByText('4.5')).toBeInTheDocument();
		expect(container.querySelector('.bg-outline-variant')).toBeInTheDocument();
	});

	it('renders image, rating and online indicator', () => {
		const { container } = render(DoctorSummary, {
			variant: 'compact',
			doctor: {
				id: 'd3',
				name: 'Bob',
				specialty: 'ENT',
				hospital: 'H',
				imageUrl: '/b.png',
				rating: '4.9',
				isOnline: true
			}
		});
		expect(screen.getByRole('img', { name: 'Bob' })).toBeInTheDocument();
		expect(screen.getByText('4.9')).toBeInTheDocument();
		expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
	});

	it('tolerates nullish id and rating', () => {
		render(DoctorSummary, {
			variant: 'compact',
			doctor: { id: nil, name: 'N', specialty: 'S', hospital: 'H', rating: nil }
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/');
	});

	it('uses an explicit href', () => {
		render(DoctorSummary, {
			variant: 'compact',
			href: '/x',
			doctor: { id: 'd', name: 'N', specialty: 'S', hospital: 'H' }
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/x');
	});
});

describe('DoctorSummary search', () => {
	it('renders defaults and the trailing snippet', () => {
		render(DoctorSummary, {
			variant: 'search',
			doctor: { id: 'd9', name: 'Carol', specialty: 'Neurology', hospital: 'Brain Center' },
			trailing: snip('<button type="button">Mark</button>')
		});
		expect(screen.getByText('C')).toBeInTheDocument();
		expect(screen.getByText('(120)')).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/d9');
		expect(screen.getByRole('button', { name: 'Mark' })).toBeInTheDocument();
	});

	it('renders image and custom rating', () => {
		render(DoctorSummary, {
			variant: 'search',
			doctor: {
				id: 'd8',
				name: 'Dan',
				specialty: 'ENT',
				hospital: 'H',
				imageUrl: '/d.png',
				rating: '4.7',
				reviewCount: 5
			}
		});
		expect(screen.getByRole('img', { name: 'Dan' })).toBeInTheDocument();
		expect(screen.getByText('(5)')).toBeInTheDocument();
	});

	it('tolerates nullish fields', () => {
		render(DoctorSummary, {
			variant: 'search',
			doctor: {
				id: nil,
				name: 'N',
				specialty: 'S',
				hospital: 'H',
				rating: nil,
				reviewCount: null as unknown as number
			}
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/doctors/');
		expect(screen.getByText('()')).toBeInTheDocument();
	});
});

describe('DoctorSummary grid', () => {
	it('renders defaults with initial and links', () => {
		render(DoctorSummary, {
			variant: 'grid',
			doctor: { id: 'x1', name: 'Eve', specialty: 'Dentist', role: 'Dentist', hospital: 'H1' }
		});
		expect(screen.getByText('E')).toBeInTheDocument();
		expect(screen.getByText('4.5')).toBeInTheDocument();
		expect(screen.getByText('(120 Reviews)')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'View Profile' })).toHaveAttribute('href', '/doctors/x1');
		expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', '/doctors/x1/book');
	});

	it('renders image and custom rating', () => {
		render(DoctorSummary, {
			variant: 'grid',
			doctor: {
				id: 'x2',
				name: 'Fay',
				specialty: 'Dentist',
				role: 'Dentist',
				hospital: 'H1',
				imageUrl: '/f.png',
				rating: '5.0',
				reviewCount: 3
			}
		});
		expect(screen.getByRole('img', { name: 'Fay' })).toBeInTheDocument();
		expect(screen.getByText('(3 Reviews)')).toBeInTheDocument();
	});

	it('tolerates nullish fields', () => {
		render(DoctorSummary, {
			variant: 'grid',
			doctor: {
				id: nil,
				name: 'N',
				specialty: 'S',
				role: 'R',
				hospital: 'H',
				rating: nil,
				reviewCount: null as unknown as number
			}
		});
		expect(screen.getByRole('link', { name: 'Book Now' })).toHaveAttribute('href', '/doctors//book');
		expect(screen.getByText('( Reviews)')).toBeInTheDocument();
	});
});

describe('DoctorSummary list', () => {
	const doctor = {
		id: 'l1',
		name: 'Gus',
		specialty: 'Cardiologist',
		role: 'Senior Cardiologist',
		hospital: 'City Hospital',
		rating: '4.8',
		reviewCount: 10
	};

	it('renders an li with badge, role, hospital, reviews and actions', () => {
		const { container } = render(DoctorSummary, {
			variant: 'list',
			doctor,
			actions: snip('<a href="/book">Book</a>')
		});
		expect(container.querySelector('li')).toBeInTheDocument();
		expect(screen.getByText('Cardiologist')).toBeInTheDocument();
		expect(screen.getByText('Senior Cardiologist')).toBeInTheDocument();
		expect(screen.getByText('City Hospital')).toBeInTheDocument();
		expect(screen.getByText('(10 reviews)')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Book' })).toHaveAttribute('href', '/book');
		expect(screen.getByText('G')).toBeInTheDocument();
	});

	it('omits the hospital row when there is no hospital', () => {
		const { container } = render(DoctorSummary, {
			variant: 'list',
			doctor: { ...doctor, hospital: undefined, imageUrl: '/g.png' }
		});
		expect(screen.getByRole('img', { name: 'Gus' })).toHaveAttribute('src', '/g.png');
		expect(container.querySelector('.lucide-map-pin')).toBeNull();
	});
});
