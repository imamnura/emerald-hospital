import { describe, expect, it } from 'vitest';
import {
	filterMedicalRecords,
	groupRecordsByMonth,
	type MedicalRecordView
} from '#lib/utils/medical-records.ts';

const record = (over: Partial<MedicalRecordView>): MedicalRecordView => ({
	id: 'r',
	title: 'Blood test',
	facility: 'Lab A',
	type: 'lab',
	recordDate: '2026-03-01',
	dateLabel: 'Mar 1, 2026',
	monthKey: '2026-03',
	monthLabel: 'March 2026',
	categoryLabel: 'Lab Result',
	fileUrl: null,
	...over
});

describe('medical-records', () => {
	it('groups by month, newest month first, preserving item order', () => {
		const records = [
			record({ id: 'a', monthKey: '2026-01', monthLabel: 'January 2026' }),
			record({ id: 'b', monthKey: '2026-03', monthLabel: 'March 2026' }),
			record({ id: 'c', monthKey: '2026-01', monthLabel: 'January 2026' }),
			record({ id: 'd', monthKey: '2025-12', monthLabel: 'December 2025' })
		];
		const groups = groupRecordsByMonth(records);
		expect(groups.map((g) => g.monthLabel)).toEqual(['March 2026', 'January 2026', 'December 2025']);
		expect(groups[1].items.map((r) => r.id)).toEqual(['a', 'c']);
		expect(groupRecordsByMonth([])).toEqual([]);
	});

	it('returns all records for an empty/blank query', () => {
		const records = [record({})];
		expect(filterMedicalRecords(records, '')).toBe(records);
		expect(filterMedicalRecords(records, '   ')).toBe(records);
	});

	it('filters case-insensitively on title, facility, category and date label', () => {
		const records = [
			record({ id: 'title', title: 'X-Ray Chest', facility: 'f1', categoryLabel: 'c1', dateLabel: 'd1' }),
			record({ id: 'fac', title: 't2', facility: 'Siloam Lab', categoryLabel: 'c2', dateLabel: 'd2' }),
			record({ id: 'cat', title: 't3', facility: 'f3', categoryLabel: 'Imaging', dateLabel: 'd3' }),
			record({ id: 'date', title: 't4', facility: 'f4', categoryLabel: 'c4', dateLabel: 'Jun 5, 2026' })
		];
		expect(filterMedicalRecords(records, ' x-ray ').map((r) => r.id)).toEqual(['title']);
		expect(filterMedicalRecords(records, 'SILOAM').map((r) => r.id)).toEqual(['fac']);
		expect(filterMedicalRecords(records, 'imaging').map((r) => r.id)).toEqual(['cat']);
		expect(filterMedicalRecords(records, 'jun').map((r) => r.id)).toEqual(['date']);
		expect(filterMedicalRecords(records, 'nothing-matches')).toEqual([]);
	});
});
