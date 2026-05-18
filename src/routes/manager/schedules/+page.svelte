<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CalendarClock, Clock, Pencil, Plus, Search, Trash2, Users } from '@lucide/svelte';
	import ConfirmDialog from '$lib/components/manager/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/manager/EmptyState.svelte';
	import Modal from '$lib/components/manager/Modal.svelte';
	import PageHeader from '$lib/components/manager/PageHeader.svelte';
	import Pagination from '$lib/components/manager/Pagination.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { toastForm } from '$lib/utils/enhance';
	import { DAY_NAMES } from '$lib/utils';

	let { data } = $props();
	type Schedule = (typeof data.schedules)[number];

	let modalOpen = $state(false);
	let editing = $state<Schedule | null>(null);

	let searchInput = $state('');
	let doctorFilter = $state('');
	$effect.pre(() => {
		searchInput = data.query;
		doctorFilter = data.doctorFilter;
	});

	let confirmOpen = $state(false);
	let confirmTarget = $state<Schedule | null>(null);
	let deleteFormEl: HTMLFormElement;
	let deletingId = $state('');
	let deleting = $state(false);

	function openAdd() {
		editing = null;
		modalOpen = true;
	}

	function openEdit(s: Schedule) {
		editing = s;
		modalOpen = true;
	}

	function askDelete(s: Schedule) {
		confirmTarget = s;
		confirmOpen = true;
	}

	function confirmDelete() {
		if (!confirmTarget) return;
		deletingId = confirmTarget.id;
		deleting = true;
		deleteFormEl.requestSubmit();
	}

	function applyFilters() {
		const params = new URLSearchParams(page.url.searchParams);
		const q = searchInput.trim();
		if (q) params.set('q', q);
		else params.delete('q');
		if (doctorFilter) params.set('doctorId', doctorFilter);
		else params.delete('doctorId');
		params.delete('page');
		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname, { keepFocus: true });
	}

	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		applyFilters();
	}
</script>

<form
	method="POST"
	action="?/delete"
	bind:this={deleteFormEl}
	class="hidden"
	use:enhance={() => async ({ result, update }) => {
		await update({ invalidateAll: true });
		deleting = false;
		confirmOpen = false;
		confirmTarget = null;
		if (result.type === 'success') toast.success('Schedule deleted.');
		else if (result.type === 'failure')
			toast.error((result.data?.error as string) ?? 'Failed to delete schedule.');
	}}
>
	<input type="hidden" name="id" bind:value={deletingId} />
</form>

<PageHeader
	title="Doctor Schedules"
	subtitle="Define when each doctor accepts appointments."
	count={data.total}
	countLabel="slots"
>
	{#snippet actions()}
		<button
			type="button"
			onclick={openAdd}
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			<Plus size={16} strokeWidth={2.25} />
			Add Schedule
		</button>
	{/snippet}
</PageHeader>

<div class="mt-6 flex flex-col gap-4">
	<form onsubmit={submitSearch} class="grid gap-2 sm:grid-cols-[1fr,auto,auto]">
		<div class="relative">
			<Search
				size={16}
				class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
			/>
			<input
				type="search"
				name="q"
				bind:value={searchInput}
				placeholder="Search by doctor name"
				class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
			/>
		</div>
		<select
			bind:value={doctorFilter}
			onchange={applyFilters}
			class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
			aria-label="Filter by doctor"
		>
			<option value="">All doctors</option>
			{#each data.doctors as d}
				<option value={d.id}>{d.name}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-primary"
		>
			Apply
		</button>
	</form>

	{#if data.schedules.length === 0}
		<EmptyState
			title={data.query || data.doctorFilter
				? 'No schedules match your filters'
				: 'No schedules yet'}
			description="Add a schedule so patients can book appointments."
		>
			{#snippet icon()}
				<CalendarClock size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[680px] text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Doctor</th>
							<th class="px-4 py-3">Day</th>
							<th class="px-4 py-3">Hours</th>
							<th class="px-4 py-3">Max Quota</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.schedules as s, i (s.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle font-medium text-on-surface">{s.doctorName}</td>
								<td class="px-4 py-3 align-middle">
									<span
										class="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary"
									>
										{DAY_NAMES[s.dayOfWeek]}
									</span>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">
									<span class="inline-flex items-center gap-1">
										<Clock size={12} class="text-outline" />
										{s.startTime} – {s.endTime}
									</span>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">
									<span class="inline-flex items-center gap-1">
										<Users size={12} class="text-outline" />
										{s.maxQuota}
									</span>
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex justify-end gap-1">
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
											aria-label="Edit schedule"
											onclick={() => openEdit(s)}
										>
											<Pencil size={14} />
										</button>
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
											aria-label="Delete schedule"
											onclick={() => askDelete(s)}
										>
											<Trash2 size={14} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination
				page={data.page}
				pageSize={data.pageSize}
				total={data.total}
				label="schedules"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={modalOpen}
	title={editing ? 'Edit schedule' : 'Add schedule'}
	description={editing
		? `${editing.doctorName} · ${DAY_NAMES[editing.dayOfWeek]}`
		: 'Block of consulting hours for a doctor'}
>
	<form
		id="schedule-form"
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: editing ? 'Schedule updated.' : 'Schedule created.',
			onSuccess: () => {
				modalOpen = false;
				editing = null;
			}
		})}
		class="space-y-3"
	>
		{#if editing}
			<input type="hidden" name="id" value={editing.id} />
		{/if}
		<label class="block text-xs font-semibold text-on-surface-variant">
			Doctor *
			<select
				name="doctorId"
				required
				value={editing?.doctorId ?? ''}
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value="">Select doctor</option>
				{#each data.doctors as d}
					<option value={d.id}>{d.name}</option>
				{/each}
			</select>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Day of week *
				<select
					name="dayOfWeek"
					required
					value={String(editing?.dayOfWeek ?? 1)}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					{#each DAY_NAMES as day, i}
						<option value={i}>{day}</option>
					{/each}
				</select>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Max quota *
				<input
					name="maxQuota"
					type="number"
					min="1"
					value={editing?.maxQuota ?? 5}
					required
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Start time *
				<input
					name="startTime"
					type="time"
					required
					value={editing?.startTime ?? '08:00'}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				End time *
				<input
					name="endTime"
					type="time"
					required
					value={editing?.endTime ?? '12:00'}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
		</div>
	</form>

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
			form="schedule-form"
			class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			{editing ? 'Save Changes' : 'Create'}
		</button>
	{/snippet}
</Modal>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete schedule?"
	message={confirmTarget
		? `Delete the ${DAY_NAMES[confirmTarget.dayOfWeek]} ${confirmTarget.startTime}–${confirmTarget.endTime} slot for ${confirmTarget.doctorName}? Existing bookings in this slot will lose their schedule reference.`
		: ''}
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => (confirmTarget = null)}
/>
