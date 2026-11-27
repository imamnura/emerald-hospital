import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SpecialistTile from './SpecialistTile.svelte';

describe('SpecialistTile chip', () => {
	it('renders inactive chip with the default icon', () => {
		const { container } = render(SpecialistTile, {
			variant: 'chip',
			name: 'General',
			icon: 'stethoscope',
			href: '#'
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '#');
		expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
		expect(screen.getByText('General')).toHaveClass('text-on-surface-variant');
	});

	it('renders active chip with icon and href', () => {
		const { container } = render(SpecialistTile, {
			variant: 'chip',
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

describe('SpecialistTile card', () => {
	it('renders link to the specialist with the fallback icon', () => {
		const { container } = render(SpecialistTile, {
			variant: 'card',
			name: 'General',
			icon: null,
			href: '/specialists/general'
		});
		expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute(
			'href',
			'/specialists/general'
		);
		expect(container.querySelector('.lucide-stethoscope')).toBeInTheDocument();
	});

	it('renders resolved icon', () => {
		const { container } = render(SpecialistTile, {
			variant: 'card',
			name: 'Eye',
			icon: 'eye',
			href: '/specialists/eye'
		});
		expect(container.querySelector('.lucide-eye')).toBeInTheDocument();
	});
});
