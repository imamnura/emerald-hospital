export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
	id: number;
	kind: ToastKind;
	message: string;
	timeout: number;
};

class ToastStore {
	toasts = $state<Toast[]>([]);
	private nextId = 1;

	push(kind: ToastKind, message: string, timeout = 4000): number {
		const id = this.nextId++;
		this.toasts.push({ id, kind, message, timeout });
		if (timeout > 0 && typeof window !== 'undefined') {
			window.setTimeout(() => this.dismiss(id), timeout);
		}
		return id;
	}

	success(message: string, timeout?: number): number {
		return this.push('success', message, timeout);
	}

	error(message: string, timeout?: number): number {
		return this.push('error', message, timeout ?? 6000);
	}

	info(message: string, timeout?: number): number {
		return this.push('info', message, timeout);
	}

	warning(message: string, timeout?: number): number {
		return this.push('warning', message, timeout);
	}

	dismiss(id: number): void {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	clear(): void {
		this.toasts = [];
	}
}

export const toast = new ToastStore();
