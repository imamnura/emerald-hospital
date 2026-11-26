import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import EmptyState from './EmptyState.svelte';

describe('EmptyState', () => {
	it('renders default icon without description', () => {
		const { container } = render(EmptyState, { title: 'Nothing here' });
		expect(screen.getByText('Nothing here')).toBeInTheDocument();
		expect(container.querySelector('.lucide-inbox')).toBeInTheDocument();
		expect(container.querySelectorAll('p')).toHaveLength(1);
	});

	it('renders custom icon and description', () => {
		const { container } = render(EmptyState, {
			title: 'No bookings',
			description: 'Try another filter',
			icon: snip('<i data-testid="custom"></i>')
		});
		expect(screen.getByTestId('custom')).toBeInTheDocument();
		expect(screen.getByText('Try another filter')).toBeInTheDocument();
		expect(container.querySelector('.lucide-inbox')).toBeNull();
	});
});
