import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import HelpContactCard from './HelpContactCard.svelte';

describe('HelpContactCard', () => {
	it('renders and calls onclick', async () => {
		const onclick = vi.fn();
		render(HelpContactCard, {
			title: 'Call us',
			description: '24/7 support',
			onclick,
			icon: snip('<i data-testid="ic"></i>')
		});
		expect(screen.getByText('24/7 support')).toBeInTheDocument();
		expect(screen.getByTestId('ic')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: /Call us/ }));
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
