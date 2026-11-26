import type { PageServerLoad } from './$types';
import {
	bookingsBySpecialty,
	bookingsOverTime,
	parseFilters,
	previousTotals,
	rangeLabel,
	recentBookings,
	statusBreakdown,
	topDoctors,
	totals
} from '#lib/server/booking/analytics.ts';
import { listHospitals, listSpecialists } from '#lib/server/catalog/catalog.ts';

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseFilters(url.searchParams);

	const [
		t,
		prev,
		series,
		status,
		bySpecialty,
		topDocs,
		recent,
		hospitals,
		specialists
	] = await Promise.all([
		totals(filters),
		previousTotals(filters),
		bookingsOverTime(filters),
		statusBreakdown(filters),
		bookingsBySpecialty(filters),
		topDoctors(filters, 5),
		recentBookings(filters, 6),
		listHospitals(),
		listSpecialists()
	]);

	function pctChange(curr: number, base: number): number | null {
		if (filters.range === 'all') return null;
		if (base === 0) return curr > 0 ? 100 : 0;
		return Math.round(((curr - base) / base) * 100);
	}

	return {
		filters,
		filterOptions: {
			hospitals: hospitals.map((h) => ({ id: h.id, name: h.name })),
			specialists: specialists.map((s) => ({ id: s.id, name: s.name }))
		},
		rangeLabel: rangeLabel(filters.range),
		totals: t,
		trend: {
			bookings: pctChange(t.bookings, prev.bookings),
			pending: pctChange(t.pending, prev.pending)
		},
		series,
		status,
		bySpecialty,
		topDoctors: topDocs,
		recent
	};
};
