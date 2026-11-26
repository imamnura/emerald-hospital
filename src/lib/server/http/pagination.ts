export type Pagination = {
	page: number;
	pageSize: number;
	offset: number;
};

export function parsePagination(
	searchParams: URLSearchParams,
	defaults: { pageSize?: number; max?: number } = {}
): Pagination {
	const maxSize = defaults.max ?? 100;
	const defaultSize = defaults.pageSize ?? 10;
	const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
	const requested = Number(searchParams.get('pageSize') ?? defaultSize);
	const pageSize = Math.min(maxSize, Math.max(1, Number.isFinite(requested) ? requested : defaultSize));
	return { page, pageSize, offset: (page - 1) * pageSize };
}
