<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ClipboardList, FileSpreadsheet, Pencil, Search } from '@lucide/svelte';
	import EmptyState from '#lib/components/manager/EmptyState.svelte';
	import Modal from '#lib/components/manager/Modal.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/manager/Pagination.svelte';
	import StatusBadge from '#lib/components/manager/StatusBadge.svelte';
	import { toastForm } from '#lib/utils/enhance.ts';
	import { formatDate } from '#lib/format/date.ts';

	let { data } = $props();
	type Booking = (typeof data.bookings)[number];
	type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

	let modalOpen = $state(false);
	let editing = $state<Booking | null>(null);
	let pendingStatus = $state<Status>('pending');

	let searchInput = $state('');
	$effect.pre(() => {
		searchInput = data.query;
	});

	function openEdit(b: Booking) {
		editing = b;
		pendingStatus = b.status as Status;
		modalOpen = true;
	}

	function setStatusTab(status: '' | Status) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		if (status) params.set('status', status);
		else params.delete('status');
		params.delete('page');
		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname);
	}

	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		const params = new URLSearchParams(page.url.searchParams.toString());
		const q = searchInput.trim();
		if (q) params.set('q', q);
		else params.delete('q');
		params.delete('page');
		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname, { reset: false });
	}

	const exportHref = $derived.by(() => {
		const params = new URLSearchParams(page.url.searchParams.toString());
		return `/manager/export.csv${params.toString() ? `?${params.toString()}` : ''}`;
	});

	const tabs: { value: '' | Status; label: string; key: 'all' | Status }[] = [
		{ value: '', label: 'All', key: 'all' },
		{ value: 'pending', label: 'Pending', key: 'pending' },
		{ value: 'confirmed', label: 'Confirmed', key: 'confirmed' },
		{ value: 'completed', label: 'Completed', key: 'completed' },
		{ value: 'cancelled', label: 'Cancelled', key: 'cancelled' }
	];
</script>

<PageHeader
	title="All Bookings"
	subtitle="Track and update every appointment in the system."
	count={data.total}
	countLabel="total"
>
	{#snippet actions()}
		<a
			href={exportHref}
			class="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
		>
			<FileSpreadsheet size={14} />
			Export CSV
		</a>
	{/snippet}
</PageHeader>

<div class="mt-6 flex flex-col gap-4">
	<form onsubmit={submitSearch} class="relative">
		<Search
			size={16}
			class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
		/>
		<input
			type="search"
			name="q"
			bind:value={searchInput}
			placeholder="Search patient, doctor, specialty, or hospital (press Enter)"
			class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
		/>
	</form>

	<div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
		{#each tabs as t}
			{@const active = data.statusFilter === t.value}
			<button
				type="button"
				onclick={() => setStatusTab(t.value)}
				class={[
					'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
					active
						? 'bg-primary text-on-primary shadow-primary'
						: 'border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
				].join(' ')}
			>
				{t.label}
				<span
					class={[
						'ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
						active ? 'bg-white/20 text-on-primary' : 'bg-surface-container text-outline'
					].join(' ')}
				>
					{data.statusCounts[t.key]}
				</span>
			</button>
		{/each}
	</div>

	{#if data.bookings.length === 0}
		<EmptyState
			title={data.query || data.statusFilter ? 'No bookings match your filters' : 'No bookings yet'}
			description="Adjust the filters or wait for patients to book."
		>
			{#snippet icon()}
				<ClipboardList size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<!-- Desktop -->
			<div class="hidden overflow-x-auto md:block">
				<table class="w-full text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Patient</th>
							<th class="px-4 py-3">Doctor</th>
							<th class="px-4 py-3">Appointment</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.bookings as b, i (b.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/50">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle font-medium text-on-surface">{b.patientName}</td>
								<td class="px-4 py-3 align-middle">
									<p class="font-medium text-on-surface">{b.doctorName}</p>
									<p class="text-xs text-outline">{b.specialty} · {b.hospital}</p>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">
									<p class="text-sm">{formatDate(String(b.appointmentDate), 'longId')}</p>
									<p class="text-xs text-outline">{b.appointmentTime}</p>
								</td>
								<td class="px-4 py-3 align-middle">
									<StatusBadge status={b.status} />
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex justify-end">
										<button
											type="button"
											class="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
											onclick={() => openEdit(b)}
										>
											<Pencil size={12} />
											Edit
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile -->
			<ul class="divide-y divide-outline-variant/20 md:hidden">
				{#each data.bookings as b (b.id)}
					<li class="px-4 py-3">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate font-heading text-sm font-bold text-on-surface">
									{b.patientName}
								</p>
								<p class="truncate text-xs text-on-surface-variant">with {b.doctorName}</p>
								<p class="truncate text-xs text-outline">{b.specialty} · {b.hospital}</p>
							</div>
							<StatusBadge status={b.status} />
						</div>
						<p class="mt-2 text-xs text-on-surface-variant">
							{formatDate(String(b.appointmentDate), 'longId')} · {b.appointmentTime}
						</p>
						<button
							type="button"
							class="mt-2 inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-semibold text-on-surface-variant"
							onclick={() => openEdit(b)}
						>
							<Pencil size={12} />
							Edit
						</button>
					</li>
				{/each}
			</ul>

			<Pagination
				page={data.page}
				pageSize={data.pageSize}
				total={data.total}
				label="bookings"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={modalOpen}
	title="Update booking status"
	description={editing ? `${editing.patientName} · ${editing.doctorName}` : ''}
>
	{#if editing}
		<form
			id="booking-form"
			method="POST"
			action="?/updateStatus"
			use:enhance={toastForm({
				successMessage: 'Booking status updated.',
				onSuccess: () => {
					modalOpen = false;
					editing = null;
				}
			})}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={editing.id} />
			<dl class="grid grid-cols-2 gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-xs">
				<div>
					<dt class="font-semibold text-outline">Date</dt>
					<dd class="mt-0.5 font-medium text-on-surface">
						{formatDate(String(editing.appointmentDate), 'longId')}
					</dd>
				</div>
				<div>
					<dt class="font-semibold text-outline">Time</dt>
					<dd class="mt-0.5 font-medium text-on-surface">{editing.appointmentTime}</dd>
				</div>
				<div>
					<dt class="font-semibold text-outline">Specialty</dt>
					<dd class="mt-0.5 font-medium text-on-surface">{editing.specialty}</dd>
				</div>
				<div>
					<dt class="font-semibold text-outline">Hospital</dt>
					<dd class="mt-0.5 font-medium text-on-surface">{editing.hospital}</dd>
				</div>
			</dl>
			<label class="block text-xs font-semibold text-on-surface-variant">
				Status
				<select
					name="status"
					bind:value={pendingStatus}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="pending">Pending</option>
					<option value="confirmed">Confirmed</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</label>
		</form>
	{/if}

	{#snippet footer()}
		<button
			type="button"
			class="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
			onclick={() => (modalOpen = false)}
		>
			Cancel
		</button>
		<button
			type="submit"
			form="booking-form"
			class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			Save
		</button>
	{/snippet}
</Modal>
