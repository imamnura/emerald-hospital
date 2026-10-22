import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import SettingsCard from './SettingsCard.svelte';
import SettingsLinkRow from './SettingsLinkRow.svelte';
import SettingsSection from './SettingsSection.svelte';
import SettingsToggle from './SettingsToggle.svelte';
import SettingsToggleRow from './SettingsToggleRow.svelte';

const icon = snip('<i data-testid="icon"></i>');

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

describe('SettingsLinkRow', () => {
	it('renders link with value and divider', () => {
		const { container } = render(SettingsLinkRow, {
			href: '/settings/lang',
			label: 'Language',
			value: 'English',
			icon,
			showDivider: true
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/settings/lang');
		expect(screen.getByText('English')).toBeInTheDocument();
		expect(screen.getByTestId('icon')).toBeInTheDocument();
		expect(container.querySelector('.border-t')).toBeInTheDocument();
	});

	it('omits value and divider by default', () => {
		const { container } = render(SettingsLinkRow, { href: '/x', label: 'Privacy', icon });
		expect(screen.getByRole('link')).toHaveTextContent('Privacy');
		expect(container.querySelector('.border-t')).toBeNull();
		expect(screen.getByRole('link').querySelectorAll(':scope > span')).toHaveLength(2);
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

	it('renders unchecked disabled state', () => {
		const { container } = render(SettingsToggle, {
			checked: false,
			disabled: true,
			ariaLabel: 'Email'
		});
		const track = container.querySelector('[role="presentation"]')!;
		expect(track).toHaveClass('opacity-60');
		expect(track).not.toHaveClass('bg-primary');
		expect(track.querySelector('[aria-hidden="true"]')).toHaveClass('translate-x-0');
	});
});

describe('SettingsToggleRow', () => {
	it('renders label, icon, toggle and divider', () => {
		const { container } = render(SettingsToggleRow, {
			label: 'Reminders',
			checked: true,
			icon,
			showDivider: true
		});
		expect(screen.getAllByText('Reminders')).toHaveLength(2);
		expect(screen.getByTestId('icon')).toBeInTheDocument();
		expect(container.querySelector('.border-t')).toBeInTheDocument();
		expect(container.querySelector('.bg-primary')).toBeInTheDocument();
	});

	it('has no divider by default', () => {
		const { container } = render(SettingsToggleRow, { label: 'SMS', checked: false, icon });
		expect(container.querySelector('.border-t')).toBeNull();
	});
});
