import { createRawSnippet } from 'svelte';

/** Build a static snippet from an HTML string (must have a single root element). */
export function snip(html: string) {
	return createRawSnippet(() => ({ render: () => html }));
}
