import { desc, eq } from 'drizzle-orm';
import { db } from './db';
import { medicalRecords, type MedicalRecord } from './db/schema';
import type { MedicalRecordType, MedicalRecordView } from '$lib/utils/medical-records';

const CATEGORY_LABEL: Record<MedicalRecordType, string> = {
	lab: 'Lab Result',
	imaging: 'Imaging',
	clinical: 'Clinical Note'
};

function toView(row: MedicalRecord): MedicalRecordView {
	const iso = String(row.recordDate);
	const d = new Date(iso + 'T12:00:00');
	const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	return {
		id: row.id,
		title: row.title,
		facility: row.facility,
		type: row.type,
		recordDate: iso,
		dateLabel: d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}),
		monthKey,
		monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
		categoryLabel: CATEGORY_LABEL[row.type],
		fileUrl: row.fileUrl
	};
}

export async function listMedicalRecordsForUser(userId: string): Promise<MedicalRecordView[]> {
	const rows = await db
		.select()
		.from(medicalRecords)
		.where(eq(medicalRecords.userId, userId))
		.orderBy(desc(medicalRecords.recordDate));
	return rows.map(toView);
}
