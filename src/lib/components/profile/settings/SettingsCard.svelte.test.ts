import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import SettingsCard from './SettingsCard.svelte';

describe('SettingsCard', () => {
	it('renders children', () => {
		render(SettingsCard, { children: snip('<p>card body</p>') });
		expect(screen.getByText('card body')).toBeInTheDocument();
	});
});
