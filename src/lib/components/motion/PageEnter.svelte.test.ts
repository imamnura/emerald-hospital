import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import PageEnter from './PageEnter.svelte';

describe('PageEnter', () => {
	it('re-renders children when pageKey changes', async () => {
		const { rerender } = render(PageEnter, { pageKey: '/a', children: snip('<p>page</p>') });
		expect(screen.getByText('page')).toBeInTheDocument();
		await rerender({ pageKey: '/b' });
		expect(screen.getAllByText('page').length).toBeGreaterThanOrEqual(1);
	});
});
