import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Layout from './+layout.svelte';
import { snip } from '#test/helpers/component.ts';

describe('root +layout', () => {
	it('renders children, title and favicon', () => {
		render(Layout, { props: { data: {}, children: snip('<p data-testid="children">root child</p>') } as never });
		expect(screen.getByTestId('children')).toHaveTextContent('root child');
		expect(document.title).toBe('Purwakarta Health');
		expect(document.head.querySelector('link[rel="icon"]')).not.toBeNull();
	});
});
