import { fireEvent, render, screen } from '@testing-library/svelte';
import { Bell, Globe } from '@lucide/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import SettingsRow from './SettingsRow.svelte';

describe('SettingsRow link', () => {
	it('renders link with trailing value and divider', () => {
		const { container } = render(SettingsRow, {
			href: '/settings/lang',
			label: 'Language',
			icon: Globe,
			divider: true,
			trailing: snip('<span>English</span>')
		});
		expect(screen.getByRole('link')).toHaveAttribute('href', '/settings/lang');
		expect(screen.getByText('English')).toBeInTheDocument();
		expect(container.querySelector('.lucide-globe')).toBeInTheDocument();
		expect(container.querySelector('.lucide-chevron-right')).toBeInTheDocument();
		expect(container.querySelector('.border-t')).toBeInTheDocument();
	});

	it('omits trailing and divider by default', () => {
		const { container } = render(SettingsRow, { href: '/x', label: 'Privacy', icon: Globe });
		expect(screen.getByRole('link')).toHaveTextContent('Privacy');
		expect(container.querySelector('.border-t')).toBeNull();
		expect(screen.getByRole('link').querySelectorAll(':scope > span')).toHaveLength(2);
	});
});

describe('SettingsRow button', () => {
	it('renders label, icon, trailing toggle and divider', () => {
		const { container } = render(SettingsRow, {
			label: 'Reminders',
			icon: Bell,
			divider: true,
			trailing: snip('<i data-testid="toggle"></i>')
		});
		expect(screen.getByRole('button')).toHaveTextContent('Reminders');
		expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
		expect(screen.getByTestId('toggle')).toBeInTheDocument();
		expect(container.querySelector('.lucide-bell')).toBeInTheDocument();
		expect(container.querySelector('.lucide-chevron-right')).toBeNull();
		expect(container.querySelector('.border-t')).toBeInTheDocument();
	});

	it('has no divider by default', () => {
		const { container } = render(SettingsRow, { label: 'SMS', icon: Bell });
		expect(container.querySelector('.border-t')).toBeNull();
	});

	it('calls onclick as a plain button', async () => {
		const onclick = vi.fn();
		render(SettingsRow, { icon: Bell, label: 'Push', onclick });
		const button = screen.getByRole('button', { name: 'Push' });
		expect(button).toHaveAttribute('type', 'button');
		await fireEvent.click(button);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('SettingsRow renders no block element inside its button', () => {
		const { container } = render(SettingsRow, { icon: Bell, label: 'Push', onclick: () => {} });
		expect(container.querySelector('button div')).toBeNull();
	});
});
