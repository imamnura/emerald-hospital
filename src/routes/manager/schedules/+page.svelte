<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CalendarClock, Clock, Users } from '@lucide/svelte';
	import DeleteConfirm from '#lib/components/manager/DeleteConfirm.svelte';
	import EmptyState from '#lib/components/manager/EmptyState.svelte';
	import Modal from '#lib/components/manager/Modal.svelte';
	import ManagerSearchForm from '#lib/components/manager/ManagerSearchForm.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/manager/Pagination.svelte';
	import RowActions from '#lib/components/manager/RowActions.svelte';
	import { MANAGER_INPUT_CLASS } from '#lib/components/manager/styles.ts';
	import { createCrudState } from '#lib/utils/crud.svelte.ts';
	import { toastForm } from '#lib/utils/enhance.ts';
	import { withParams } from '#lib/utils/url.ts';
	import { DAY_NAMES } from '#lib/format/date.ts';

	let { data } = $props();
	type Schedule = (typeof data.schedules)[number];

	const crud = createCrudState<Schedule>();

	let searchInput = $state('');
	let doctorFilter = $state('');
	$effect.pre(() => {
		searchInput = data.query;
		doctorFilter = data.doctorFilter;
	});

	function applyFilters() {
		const updates = { q: searchInput.trim(), doctorId: doctorFilter };
		goto(withParams(page.url, updates, { relative: true }), { reset: false });
	}
</script>

<PageHeader
	title="Doctor Schedules"
	subtitle="Define when each doctor accepts appointments."
	count={data.total}
	countLabel="slots"
	addLabel="Add Schedule"
	onadd={() => crud.openAdd()}
/>

<div class="mt-6 flex flex-col gap-4">
	<ManagerSearchForm
		bind:value={searchInput}
		placeholder="Search by doctor name"
		class="sm:grid-cols-[1fr,auto,auto]"
		onsubmit={() => applyFilters()}
	>
		{#snippet filters()}
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
		{/snippet}
	</ManagerSearchForm>

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
									<RowActions name='schedule' onedit={() => crud.openEdit(s)} ondelete={() => crud.askDelete(s)} />
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
	bind:open={crud.modalOpen}
	formId="schedule-form"
	submitLabel={crud.editing ? 'Save Changes' : 'Create'}
	title={crud.editing ? 'Edit schedule' : 'Add schedule'}
	description={crud.editing
		? `${crud.editing.doctorName} · ${DAY_NAMES[crud.editing.dayOfWeek]}`
		: 'Block of consulting hours for a doctor'}
>
	<form
		id="schedule-form"
		method="POST"
		action={crud.editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: crud.editing ? 'Schedule updated.' : 'Schedule created.',
			onSuccess: () => {
				crud.modalOpen = false;
				crud.editing = null;
			}
		})}
		class="space-y-3"
	>
		{#if crud.editing}
			<input type="hidden" name="id" value={crud.editing.id} />
		{/if}
		<label class="block text-xs font-semibold text-on-surface-variant">
			Doctor *
			<select
				name="doctorId"
				required
				value={crud.editing?.doctorId ?? ''}
				class={MANAGER_INPUT_CLASS}
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
					value={String(crud.editing?.dayOfWeek ?? 1)}
					class={MANAGER_INPUT_CLASS}
				>
					{#each DAY_NAMES as day, i}
						<option value={String(i)}>{day}</option>
					{/each}
				</select>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Max quota *
				<input
					name="maxQuota"
					type="number"
					min="1"
					value={crud.editing?.maxQuota ?? 5}
					required
					class={MANAGER_INPUT_CLASS}
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
					value={crud.editing?.startTime ?? '08:00'}
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				End time *
				<input
					name="endTime"
					type="time"
					required
					value={crud.editing?.endTime ?? '12:00'}
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
		</div>
	</form>

</Modal>

<DeleteConfirm
	bind:open={crud.confirmOpen}
	target={crud.confirmTarget}
	title="Delete schedule?"
	message={crud.confirmTarget
		? `Delete the ${DAY_NAMES[crud.confirmTarget.dayOfWeek]} ${crud.confirmTarget.startTime}–${crud.confirmTarget.endTime} slot for ${crud.confirmTarget.doctorName}? Existing bookings in this slot will lose their schedule reference.`
		: ''}
	successMessage="Schedule deleted."
	failureMessage="Failed to delete schedule."
	onclose={() => (crud.confirmTarget = null)}
/>
