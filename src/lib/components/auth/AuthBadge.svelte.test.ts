import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AuthBadge from './AuthBadge.svelte';

describe('AuthBadge', () => {
	it('logo renders shield and plus icons', () => {
		const { container } = render(AuthBadge, { variant: 'logo' });
		expect(container.querySelector('.lucide-shield')).toBeInTheDocument();
		expect(container.querySelector('.lucide-plus')).toBeInTheDocument();
	});

	it('reset renders rotate and lock icons', () => {
		const { container } = render(AuthBadge, { variant: 'reset' });
		expect(container.querySelectorAll('svg')).toHaveLength(2);
		expect(container.querySelector('.lucide-lock')).toBeInTheDocument();
	});

	it('register renders a leaf icon', () => {
		const { container } = render(AuthBadge, { variant: 'register' });
		expect(container.querySelector('.lucide-leaf')).toBeInTheDocument();
	});
});
