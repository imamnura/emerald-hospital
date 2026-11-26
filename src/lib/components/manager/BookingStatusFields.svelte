<script lang="ts">
	import { MANAGER_INPUT_CLASS } from '#lib/components/manager/styles.ts';
	import type { BookingStatus } from '#lib/domain/booking-status.ts';
	import { formatDate } from '#lib/format/date.ts';

	type EditingBooking = {
		appointmentDate: string | Date;
		appointmentTime: string;
		specialty: string;
		hospital: string;
	};

	interface Props {
		booking: EditingBooking;
		status: BookingStatus;
	}

	let { booking, status = $bindable() }: Props = $props();
</script>

<dl class="grid grid-cols-2 gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-xs">
	<div>
		<dt class="font-semibold text-outline">Date</dt>
		<dd class="mt-0.5 font-medium text-on-surface">
			{formatDate(String(booking.appointmentDate), 'longId')}
		</dd>
	</div>
	<div>
		<dt class="font-semibold text-outline">Time</dt>
		<dd class="mt-0.5 font-medium text-on-surface">{booking.appointmentTime}</dd>
	</div>
	<div>
		<dt class="font-semibold text-outline">Specialty</dt>
		<dd class="mt-0.5 font-medium text-on-surface">{booking.specialty}</dd>
	</div>
	<div>
		<dt class="font-semibold text-outline">Hospital</dt>
		<dd class="mt-0.5 font-medium text-on-surface">{booking.hospital}</dd>
	</div>
</dl>
<label class="block text-xs font-semibold text-on-surface-variant">
	Status
	<select name="status" bind:value={status} class={MANAGER_INPUT_CLASS}>
		<option value="pending">Pending</option>
		<option value="confirmed">Confirmed</option>
		<option value="completed">Completed</option>
		<option value="cancelled">Cancelled</option>
	</select>
</label>
