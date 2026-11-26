import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import SettingsSection from './SettingsSection.svelte';

describe('SettingsSection', () => {
	it('renders title and children', () => {
		render(SettingsSection, { title: 'Account', children: snip('<p>inside</p>') });
		expect(screen.getByText('Account')).toBeInTheDocument();
		expect(screen.getByText('inside')).toBeInTheDocument();
	});
});
