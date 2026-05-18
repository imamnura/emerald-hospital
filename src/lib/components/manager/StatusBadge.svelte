<script lang="ts">
	import { cn } from '$lib/utils';

	type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

	interface Props {
		status: Status | string;
	}

	let { status }: Props = $props();

	const LABEL: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const COLOR: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800 ring-amber-200',
		confirmed: 'bg-primary/10 text-primary ring-primary/20',
		completed: 'bg-surface-container text-on-surface-variant ring-outline-variant/40',
		cancelled: 'bg-red-50 text-error ring-red-200'
	};

	const DOT: Record<string, string> = {
		pending: 'bg-amber-500',
		confirmed: 'bg-primary',
		completed: 'bg-outline',
		cancelled: 'bg-error'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
		COLOR[status] ?? 'bg-surface-container text-on-surface-variant ring-outline-variant/40'
	)}
>
	<span class={cn('h-1.5 w-1.5 rounded-full', DOT[status] ?? 'bg-outline')}></span>
	{LABEL[status] ?? status}
</span>
