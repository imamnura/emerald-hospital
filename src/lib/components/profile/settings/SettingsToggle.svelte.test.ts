import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SettingsToggle from './SettingsToggle.svelte';

describe('SettingsToggle', () => {
	it('renders checked state with accessible label', () => {
		const { container } = render(SettingsToggle, { checked: true, ariaLabel: 'Push' });
		expect(screen.getByText('Push')).toHaveClass('sr-only');
		const track = container.querySelector('[role="presentation"]')!;
		expect(track).toHaveClass('bg-primary');
		expect(track).not.toHaveClass('opacity-60');
		expect(track.querySelector('[aria-hidden="true"]')).toHaveClass('translate-x-5');
	});
});
