import { describe, expect, it } from 'vitest';
import { createCrudState } from './crud.svelte.ts';

type Row = { id: string; name: string };
const row: Row = { id: 'r1', name: 'One' };

describe('createCrudState', () => {
	it('starts closed and empty', () => {
		const crud = createCrudState<Row>();
		expect(crud).toMatchObject({
			modalOpen: false,
			editing: null,
			confirmTarget: null,
			confirmOpen: false
		});
	});

	it('openAdd clears editing and opens the modal', () => {
		const crud = createCrudState<Row>();
		crud.editing = row;
		crud.openAdd();
		expect(crud.editing).toBeNull();
		expect(crud.modalOpen).toBe(true);
	});

	it('openEdit sets editing and opens the modal', () => {
		const crud = createCrudState<Row>();
		crud.openEdit(row);
		expect(crud.editing).toEqual(row);
		expect(crud.modalOpen).toBe(true);
	});

	it('askDelete sets the confirm target and opens the confirm dialog', () => {
		const crud = createCrudState<Row>();
		crud.askDelete(row);
		expect(crud.confirmTarget).toEqual(row);
		expect(crud.confirmOpen).toBe(true);
	});
});
