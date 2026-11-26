<script lang="ts">
	import { formatDate } from '#lib/format/date.ts';
	import { getStatusClass, getStatusLabel } from '#lib/domain/booking-status.ts';
	import { cn } from '#lib/utils/cn.ts';

	type RecentBooking = {
		id: string;
		patient: string;
		doctor: string;
		specialty: string;
		hospital: string;
		date: string;
		time: string;
		status: string;
	};

	let { recent }: { recent: RecentBooking[] } = $props();
</script>

<section
	class="mt-4 overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
>
	<div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 px-5 py-4">
		<div>
			<h2 class="font-heading text-base font-bold text-on-surface">Recent bookings</h2>
			<p class="text-xs text-outline">Latest activity matching your filters</p>
		</div>
		<a href="/manager/bookings" class="text-sm font-semibold text-primary hover:underline">
			View all →
		</a>
	</div>

	{#if recent.length === 0}
		<p class="px-5 py-10 text-center text-sm text-outline">No bookings to show.</p>
	{:else}
		<!-- Desktop table -->
		<div class="hidden overflow-x-auto sm:block">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline">
						<th class="w-12 px-5 py-3 text-right">No.</th>
						<th class="px-5 py-3">Patient</th>
						<th class="px-5 py-3">Doctor</th>
						<th class="px-5 py-3">When</th>
						<th class="px-5 py-3">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each recent as b, i (b.id)}
						<tr class="border-t border-outline-variant/20">
							<td class="px-5 py-3 text-right text-xs text-outline tabular-nums">{i + 1}</td>
							<td class="px-5 py-3 font-medium text-on-surface">{b.patient}</td>
							<td class="px-5 py-3">
								<p class="font-medium text-on-surface">{b.doctor}</p>
								<p class="text-xs text-outline">{b.specialty} · {b.hospital}</p>
							</td>
							<td class="px-5 py-3 text-on-surface-variant">
								{formatDate(b.date, 'short')}
								<span class="text-outline">· {b.time}</span>
							</td>
							<td class="px-5 py-3">
								<span
									class={cn(
										'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
										getStatusClass('badge', b.status)
									)}
								>
									{getStatusLabel(b.status)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- Mobile cards -->
		<ul class="divide-y divide-outline-variant/20 sm:hidden">
			{#each recent as b (b.id)}
				<li class="px-4 py-3">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-on-surface">{b.patient}</p>
							<p class="truncate text-xs text-outline">{b.doctor} · {b.specialty}</p>
							<p class="mt-1 text-xs text-on-surface-variant">
								{formatDate(b.date, 'short')} · {b.time}
							</p>
						</div>
						<span
							class={cn(
								'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
								getStatusClass('badge', b.status)
							)}
						>
							{getStatusLabel(b.status)}
						</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
