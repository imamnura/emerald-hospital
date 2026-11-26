import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import SettingsCard from './SettingsCard.svelte';
import SettingsSection from './SettingsSection.svelte';
import SettingsToggle from './SettingsToggle.svelte';

describe('SettingsCard', () => {
	it('renders children', () => {
		render(SettingsCard, { children: snip('<p>card body</p>') });
		expect(screen.getByText('card body')).toBeInTheDocument();
	});
});

describe('SettingsSection', () => {
	it('renders title and children', () => {
		render(SettingsSection, { title: 'Account', children: snip('<p>inside</p>') });
		expect(screen.getByText('Account')).toBeInTheDocument();
		expect(screen.getByText('inside')).toBeInTheDocument();
	});
});

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
