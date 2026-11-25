import { describe, expect, it } from 'vitest';
import {
	filterMedicalRecords,
	groupRecordsByMonth,
	type MedicalRecordView
} from '#lib/utils/medical-records.ts';
import {
	txPaymentLabel,
	type TransactionView
} from '#lib/utils/payments.ts';
import {
	doctorRoleLabel,
	specialistAvailabilityLabel,
	specialistPluralTitle
} from '#lib/utils/specialist.ts';
import type { InsuranceProfileView } from '#lib/utils/insurance.ts';

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

describe('payments', () => {
	it('labels payment method', () => {
		const tx = (cardBrand: TransactionView['cardBrand'], cardLast4: string | null): TransactionView => ({
			id: 't',
			title: 'x',
			amount: 1,
			currency: 'USD',
			paidAt: new Date(),
			cardBrand,
			cardLast4
		});
		expect(txPaymentLabel(tx('visa', '4242'))).toBe('Visa *4242');
		expect(txPaymentLabel(tx('mastercard', '5555'))).toBe('MC *5555');
		expect(txPaymentLabel(tx(null, '1111'))).toBe('Card');
		expect(txPaymentLabel(tx('visa', null))).toBe('Card');
	});
});

describe('specialist', () => {
	it.each([
		['Cardiology', 'Cardiologists'],
		['Dental', 'Dentists'],
		['Eye Care', 'Ophthalmologists'],
		['ENT', 'ENT Specialists'],
		['General', 'General Practitioners'],
		['Oncology', 'Oncologists'],
		['Podiatry', 'Podiatry Specialists']
	])('plural title %s -> %s', (name, title) => {
		expect(specialistPluralTitle(name)).toBe(title);
	});

	it('labels doctor role, prefixing Senior for rating >= 4.8', () => {
		expect(doctorRoleLabel('Cardiology', '4.5')).toBe('Cardiologist');
		expect(doctorRoleLabel('Cardiology', '4.8')).toBe('Senior Cardiologist');
		expect(doctorRoleLabel('Eye Care', '5.0')).toBe('Senior Ophthalmologist');
		expect(doctorRoleLabel('Podiatry', '4.79')).toBe('Podiatry');
		expect(doctorRoleLabel('Podiatry', '4.9')).toBe('Senior Podiatry');
		expect(doctorRoleLabel('General', 'n/a')).toBe('General Practitioner');
	});

	it('pluralises availability label', () => {
		expect(specialistAvailabilityLabel(0)).toBe('0 Specialists available');
		expect(specialistAvailabilityLabel(1)).toBe('1 Specialist available');
		expect(specialistAvailabilityLabel(12)).toBe('12 Specialists available');
	});
});

describe('insurance types', () => {
	it('module is type-only and importable', async () => {
		const mod = await import('#lib/utils/insurance.ts');
		const view: InsuranceProfileView = {
			id: null,
			providerName: 'BPJS',
			planName: 'Gold',
			memberName: 'A',
			memberId: 'M',
			groupNo: 'G',
			planType: 'PPO',
			coveragePeriod: '',
			coverageStart: null,
			coverageEnd: null,
			status: 'ACTIVE',
			costs: [],
			providerPhone: ''
		};
		expect(mod).toBeTypeOf('object');
		expect(view.status).toBe('ACTIVE');
	});
});
