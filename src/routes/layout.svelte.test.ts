import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Layout from './+layout.svelte';
import { childrenSnippet } from '../test/helpers-pages-public.ts';

describe('root +layout', () => {
	it('renders children, title and favicon', () => {
		render(Layout, { props: { data: {}, children: childrenSnippet('root child') } as never });
		expect(screen.getByTestId('children')).toHaveTextContent('root child');
		expect(document.title).toBe('Purwakarta Health');
		expect(document.head.querySelector('link[rel="icon"]')).not.toBeNull();
	});
});
