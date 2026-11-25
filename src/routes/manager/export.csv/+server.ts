import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STATUS_LABEL } from '#lib/domain/booking-status.ts';
import { exportRows, parseFilters, rangeLabel } from '#lib/server/analytics.ts';
import { isManager } from '#lib/server/guards.ts';

function escapeCell(value: string | number): string {
	const s = String(value ?? '');
	if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!isManager(locals)) error(403, 'Manager access required');

	const filters = parseFilters(url.searchParams);
	const rows = await exportRows(filters);

	const header = [
		'Booking ID',
		'Patient',
		'Doctor',
		'Specialty',
		'Hospital',
		'Appointment Date',
		'Appointment Time',
		'Status'
	];

	const lines = [
		`# Emerald Hospital bookings — ${rangeLabel(filters.range)}`,
		`# Generated ${new Date().toISOString()}`,
		header.map(escapeCell).join(','),
		...rows.map((r) =>
			[
				r.id,
				r.patient,
				r.doctor,
				r.specialty,
				r.hospital,
				r.date,
				r.time,
				STATUS_LABEL[r.status]
			]
				.map(escapeCell)
				.join(',')
		)
	];

	const body = lines.join('\n');
	// Excel/Sheets need UTF-8 BOM to display non-ASCII names correctly
	const csv = '﻿' + body;

	const stamp = new Date().toISOString().slice(0, 10);
	const filename = `emerald-bookings-${filters.range}-${stamp}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
