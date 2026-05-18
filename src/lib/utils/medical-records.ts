export type MedicalRecordType = 'lab' | 'imaging' | 'clinical';

export type MedicalRecordView = {
	id: string;
	title: string;
	facility: string;
	type: MedicalRecordType;
	recordDate: string;
	dateLabel: string;
	monthKey: string;
	monthLabel: string;
	categoryLabel: string;
	fileUrl: string | null;
};

export function groupRecordsByMonth(records: MedicalRecordView[]) {
	const map = new Map<string, { monthLabel: string; items: MedicalRecordView[] }>();
	for (const r of records) {
		const existing = map.get(r.monthKey);
		if (existing) existing.items.push(r);
		else map.set(r.monthKey, { monthLabel: r.monthLabel, items: [r] });
	}
	return [...map.entries()]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([, group]) => group);
}

export function filterMedicalRecords(records: MedicalRecordView[], query: string) {
	const q = query.trim().toLowerCase();
	if (!q) return records;
	return records.filter(
		(r) =>
			r.title.toLowerCase().includes(q) ||
			r.facility.toLowerCase().includes(q) ||
			r.categoryLabel.toLowerCase().includes(q) ||
			r.dateLabel.toLowerCase().includes(q)
	);
}
