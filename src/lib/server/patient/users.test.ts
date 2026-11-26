import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeUser } from '../../../test/factories.ts';
import { verifyPassword } from '../auth/session.ts';
import { getUserByEmail, getUserById, parseProfileForm, setPassword, updateProfile } from './users.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const fd = (o: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) f.set(k, v);
	return f;
};

describe('getUserByEmail', () => {
	it('finds by email', async () => {
		const u = await makeUser({ email: 'find@x.com' });
		expect((await getUserByEmail('find@x.com'))?.id).toBe(u.id);
	});
	it('returns undefined when missing', async () => {
		expect(await getUserByEmail('nobody@x.com')).toBeUndefined();
	});
});

describe('setPassword', () => {
	it('stores a verifiable hash', async () => {
		const u = await makeUser();
		await setPassword(u.id, 'new-pass-123');
		const row = await getUserById(u.id);
		expect(await verifyPassword(row!.passwordHash!, 'new-pass-123')).toBe(true);
	});
});

describe('parseProfileForm', () => {
	it('requires a name', () => {
		expect(parseProfileForm(fd({ gender: 'prefer_not' }))).toEqual({
			error: 'Full name is required.'
		});
		expect(parseProfileForm(fd({ name: '   ', gender: 'prefer_not' }))).toEqual({
			error: 'Full name is required.'
		});
	});

	it('nulls out empty optional fields', () => {
		expect(parseProfileForm(fd({ name: ' Ann ', gender: 'prefer_not' }))).toEqual({
			name: 'Ann',
			phone: null,
			imageUrl: null,
			bloodType: null,
			dateOfBirth: null,
			gender: null,
			address: null
		});
	});

	it('parses a full valid form (trimmed)', () => {
		expect(
			parseProfileForm(
				fd({
					name: 'Ann',
					phone: ' 0812 ',
					imageUrl: 'http://x/y.png',
					bloodType: 'AB-',
					dateOfBirth: '1990-05-01',
					gender: 'female',
					address: ' Jl. X '
				})
			)
		).toEqual({
			name: 'Ann',
			phone: '0812',
			imageUrl: 'http://x/y.png',
			bloodType: 'AB-',
			dateOfBirth: '1990-05-01',
			gender: 'female',
			address: 'Jl. X'
		});
	});

	it('rejects an invalid blood type', () => {
		expect(parseProfileForm(fd({ name: 'A', gender: 'male', bloodType: 'Z+' }))).toEqual({
			error: 'Invalid blood type.'
		});
	});

	it('rejects a malformed date of birth', () => {
		expect(parseProfileForm(fd({ name: 'A', gender: 'male', dateOfBirth: 'nope' }))).toEqual({
			error: 'Enter a valid date of birth (MM/DD/YYYY).'
		});
	});

	it('accepts a MM/DD/YYYY date of birth and normalises it to ISO', () => {
		const parsed = parseProfileForm(fd({ name: 'A', gender: 'male', dateOfBirth: '5/1/1990' }));
		expect((parsed as { dateOfBirth: unknown }).dateOfBirth).toBe('1990-05-01');
	});

	it('rejects an unknown gender', () => {
		expect(parseProfileForm(fd({ name: 'A', gender: 'robot' }))).toEqual({
			error: 'Please select a valid gender.'
		});
	});
});

describe('updateProfile / getUserById', () => {
	it('updates only the target user and returns the new row', async () => {
		const u = await makeUser({ name: 'Old' });
		const other = await makeUser({ name: 'Other' });
		const row = await updateProfile(u.id, { name: 'New', bloodType: 'O+', gender: 'male', dateOfBirth: '2000-01-02' });
		expect(row).toMatchObject({ id: u.id, name: 'New', bloodType: 'O+', gender: 'male', dateOfBirth: '2000-01-02' });
		expect((await getUserById(u.id))?.name).toBe('New');
		expect((await getUserById(other.id))?.name).toBe('Other');
	});

	it('returns undefined when updating a missing user, null when reading one', async () => {
		const id = '00000000-0000-0000-0000-000000000000';
		expect(await updateProfile(id, { name: 'X' })).toBeUndefined();
		expect(await getUserById(id)).toBeNull();
	});
});
