import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { medicalRecords, type MedicalRecord } from '#lib/server/db/schema.ts';
import { formatDate, parseIsoDate } from '#lib/format/date.ts';
import type { MedicalRecordType, MedicalRecordView } from '#lib/utils/medical-records.ts';

const CATEGORY_LABEL: Record<MedicalRecordType, string> = {
	lab: 'Lab Result',
	imaging: 'Imaging',
	clinical: 'Clinical Note'
};

function toView(row: MedicalRecord): MedicalRecordView {
	const iso = String(row.recordDate);
	const d = parseIsoDate(iso);
	const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	return {
		id: row.id,
		title: row.title,
		facility: row.facility,
		type: row.type,
		recordDate: iso,
		dateLabel: formatDate(iso, 'short'),
		monthKey,
		monthLabel: formatDate(iso, 'monthYear').toUpperCase(),
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
