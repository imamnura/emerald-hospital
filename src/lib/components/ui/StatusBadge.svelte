<script lang="ts">
	import { getStatusClass, getStatusLabel, type BookingStatus } from '#lib/domain/booking-status.ts';
	import { cn } from '#lib/utils/cn.ts';

	type Status = BookingStatus;

	interface Props {
		status: Status | string;
	}

	let { status }: Props = $props();
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
		getStatusClass('pill', status)
	)}
>
	<span class={cn('h-1.5 w-1.5 rounded-full', getStatusClass('dot', status))}></span>
	{getStatusLabel(status)}
</span>
