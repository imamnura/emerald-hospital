import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeMedicalRecord, makeUser } from '../../../test/factories.ts';
import { listMedicalRecordsForUser } from './medical-records.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('listMedicalRecordsForUser', () => {
	it('returns an empty list for a user with no records', async () => {
		const u = await makeUser();
		expect(await listMedicalRecordsForUser(u.id)).toEqual([]);
	});

	it('maps rows to views, newest first, scoped to the user', async () => {
		const u = await makeUser();
		const other = await makeUser();
		const lab = await makeMedicalRecord(u.id, { recordDate: '2026-03-01' });
		const img = await makeMedicalRecord(u.id, {
			title: 'MRI',
			facility: 'Imaging Center',
			type: 'imaging',
			recordDate: '2026-04-15',
			fileUrl: '/files/mri.pdf'
		});
		const note = await makeMedicalRecord(u.id, { type: 'clinical', recordDate: '2025-12-09' });
		await makeMedicalRecord(other.id);

		const views = await listMedicalRecordsForUser(u.id);
		expect(views.map((v) => v.id)).toEqual([img.id, lab.id, note.id]);
		expect(views[0]).toEqual({
			id: img.id,
			title: 'MRI',
			facility: 'Imaging Center',
			type: 'imaging',
			recordDate: '2026-04-15',
			dateLabel: 'Apr 15, 2026',
			monthKey: '2026-04',
			monthLabel: 'APRIL 2026',
			categoryLabel: 'Imaging',
			fileUrl: '/files/mri.pdf'
		});
		expect(views[1]).toMatchObject({ categoryLabel: 'Lab Result', monthKey: '2026-03', fileUrl: null });
		expect(views[2]).toMatchObject({
			categoryLabel: 'Clinical Note',
			monthKey: '2025-12',
			monthLabel: 'DECEMBER 2025',
			dateLabel: 'Dec 9, 2025'
		});
	});
});
