/** Test stand-in for `$app/state`. Mutate `page` (or call `setPage`) before rendering. */
type Page = {
	url: URL;
	params: Record<string, string>;
	route: { id: string | null };
	status: number;
	error: unknown;
	data: Record<string, unknown>;
	form: unknown;
	state: Record<string, unknown>;
};

function initial(): Page {
	return {
		url: new URL('http://localhost/'),
		params: {},
		route: { id: null },
		status: 200,
		error: null,
		data: {},
		form: null,
		state: {}
	};
}

export const page = $state<Page>(initial());

export const navigating = $state<{ current: null }>({ current: null });
export const updated = $state({ current: false, check: async () => false });

export function setPage(patch: Partial<Omit<Page, 'url'>> & { url?: string | URL }): void {
	const { url, ...rest } = patch;
	if (url !== undefined) page.url = new URL(url, 'http://localhost/');
	Object.assign(page, rest);
}

export function resetPage(): void {
	Object.assign(page, initial());
}
