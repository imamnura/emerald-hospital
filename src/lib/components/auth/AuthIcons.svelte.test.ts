import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AuthForgotIcon from './AuthForgotIcon.svelte';
import AuthLogo from './AuthLogo.svelte';
import AuthRegisterLogo from './AuthRegisterLogo.svelte';

describe('auth icons', () => {
	it('AuthLogo renders shield and plus icons', () => {
		const { container } = render(AuthLogo);
		expect(container.querySelector('.lucide-shield')).toBeInTheDocument();
		expect(container.querySelector('.lucide-plus')).toBeInTheDocument();
	});

	it('AuthForgotIcon renders rotate and lock icons', () => {
		const { container } = render(AuthForgotIcon);
		expect(container.querySelectorAll('svg')).toHaveLength(2);
		expect(container.querySelector('.lucide-lock')).toBeInTheDocument();
	});

	it('AuthRegisterLogo renders a leaf icon', () => {
		const { container } = render(AuthRegisterLogo);
		expect(container.querySelector('.lucide-leaf')).toBeInTheDocument();
	});
});
