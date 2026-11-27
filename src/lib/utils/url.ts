interface WithParamsOptions {
	/** Drop `page` so the new filter starts at the first page. Default `true`. */
	resetPage?: boolean;
	/** Return `?query` (or the bare pathname) instead of `pathname?query`. */
	relative?: boolean;
}

/** The part of `URL` we read; SvelteKit's `page.url` has a read-only `searchParams`. */
type UrlLike = { pathname: string; searchParams: { toString(): string } };

/**
 * Builds a href from `url` with `updates` applied. `null` / `''` remove a param;
 * existing params keep their position, new ones are appended in update order.
 */
export function withParams(
	url: UrlLike,
	updates: Record<string, string | null>,
	opts: WithParamsOptions = {}
): string {
	const { resetPage = true, relative = false } = opts;
	const params = new URLSearchParams(url.searchParams.toString());
	for (const [key, value] of Object.entries(updates)) {
		if (value === null || value === '') params.delete(key);
		else params.set(key, value);
	}
	if (resetPage) params.delete('page');
	const qs = params.toString();
	if (relative) return qs ? `?${qs}` : url.pathname;
	return qs ? `${url.pathname}?${qs}` : url.pathname;
}

const FIND_DOCTOR_URL = new URL('/find-doctor', 'http://localhost');

/** `/find-doctor` href for a specialty query and hospital filter (`'all'` = no filter). */
export function findDoctorHref(specialty: string, hospital: string): string {
	return withParams(FIND_DOCTOR_URL, {
		q: specialty.trim(),
		hospital: hospital === 'all' ? null : hospital
	});
}
