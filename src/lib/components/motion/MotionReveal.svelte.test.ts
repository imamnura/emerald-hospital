import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import MotionReveal from './MotionReveal.svelte';

describe('MotionReveal', () => {
	it('renders children with merged class', () => {
		const { container } = render(MotionReveal, {
			class: 'extra',
			delay: 50,
			children: snip('<p>revealed</p>')
		});
		expect(screen.getByText('revealed')).toBeInTheDocument();
		expect(container.querySelector('div.contents.extra')).toBeInTheDocument();
	});

	it('uses default props', () => {
		const { container } = render(MotionReveal, { children: snip('<p>plain</p>') });
		expect(container.querySelector('div.contents')).toBeInTheDocument();
		expect(screen.getByText('plain')).toBeInTheDocument();
	});
});
