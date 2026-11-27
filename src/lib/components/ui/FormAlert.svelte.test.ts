import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import FormAlert from './FormAlert.svelte';

describe('FormAlert', () => {
	it('renders nothing without a message', () => {
		const { container } = render(FormAlert, { message: '' });
		expect(container.textContent).toBe('');
		const nil = render(FormAlert, { message: null });
		expect(nil.container.textContent).toBe('');
	});

	it('renders the error banner classes by default', () => {
		render(FormAlert, { message: 'Boom' });
		expect(screen.getByText('Boom').className).toBe(
			'rounded-xl bg-error-container px-4 py-3 text-sm text-error'
		);
	});

	it('renders the success and info kinds', () => {
		render(FormAlert, { kind: 'success', message: 'Saved' });
		expect(screen.getByText('Saved')).toHaveClass('bg-primary/10', 'text-primary');
		render(FormAlert, { kind: 'info', message: 'FYI' });
		expect(screen.getByText('FYI')).toHaveClass('text-on-surface-variant');
	});
});
