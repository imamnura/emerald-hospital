/** Reactive state shared by the manager list pages (add/edit modal + delete confirm). */
class CrudState<T extends { id: string }> {
	modalOpen = $state(false);
	editing = $state<T | null>(null);
	confirmTarget = $state<T | null>(null);
	confirmOpen = $state(false);

	openAdd(): void {
		this.editing = null;
		this.modalOpen = true;
	}

	openEdit(row: T): void {
		this.editing = row;
		this.modalOpen = true;
	}

	askDelete(row: T): void {
		this.confirmTarget = row;
		this.confirmOpen = true;
	}
}

export function createCrudState<T extends { id: string }>(): CrudState<T> {
	return new CrudState<T>();
}
