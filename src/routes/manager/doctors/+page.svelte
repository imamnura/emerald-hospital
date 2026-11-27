<script lang="ts">
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { getInitials } from '#lib/format/text.ts';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Star, Stethoscope } from '@lucide/svelte';
	import DeleteConfirm from '#lib/components/manager/DeleteConfirm.svelte';
	import DoctorFormFields from '#lib/components/manager/DoctorFormFields.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import ManagerSearchForm from '#lib/components/manager/ManagerSearchForm.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import RowActions from '#lib/components/manager/RowActions.svelte';
	import { createCrudState } from '#lib/utils/crud.svelte.ts';
	import { toastForm } from '#lib/utils/enhance.ts';
	import { withParams } from '#lib/utils/url.ts';

	let { data } = $props();
	type Doctor = (typeof data.doctors)[number];

	const crud = createCrudState<Doctor>();

	let searchInput = $derived(data.query);
	let hospitalFilter = $derived(data.hospitalFilter);
	let specialistFilter = $derived(data.specialistFilter);

	function applyFilters() {
		const updates = { q: searchInput.trim(), hospitalId: hospitalFilter, specialistId: specialistFilter };
		goto(withParams(page.url, updates, { relative: true }), { reset: false });
	}
</script>

<PageHeader
	title="Doctors"
	subtitle="Manage doctor profiles and assignments."
	count={data.total}
	countLabel="total"
	addLabel="Add Doctor"
	onadd={() => crud.openAdd()}
/>

<div class="mt-6 flex flex-col gap-4">
	<ManagerSearchForm
		bind:value={searchInput}
		placeholder="Search by name, specialty, or hospital"
		class="sm:grid-cols-[1fr,auto,auto,auto]"
		onsubmit={() => applyFilters()}
	>
		{#snippet filters()}
			<select
				bind:value={hospitalFilter}
				onchange={applyFilters}
				class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
				aria-label="Filter by hospital"
			>
				<option value="">All hospitals</option>
				{#each data.hospitals as h (h.id)}
					<option value={h.id}>{h.name}</option>
				{/each}
			</select>
			<select
				bind:value={specialistFilter}
				onchange={applyFilters}
				class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
				aria-label="Filter by specialty"
			>
				<option value="">All specialties</option>
				{#each data.specialists as s (s.id)}
					<option value={s.id}>{s.name}</option>
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

	{#if data.doctors.length === 0}
		<EmptyState
			title={data.query || data.hospitalFilter || data.specialistFilter
				? 'No doctors match your filters'
				: 'No doctors yet'}
			description="Add a doctor or adjust your filters."
		>
			{#snippet icon()}
				<Stethoscope size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[800px] text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Name</th>
							<th class="px-4 py-3">Specialty</th>
							<th class="px-4 py-3">Hospital</th>
							<th class="px-4 py-3">Rating</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.doctors as d, i (d.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex items-center gap-2.5">
										<Avatar
											name={d.name}
											size="sm"
											class="shrink-0"
											fallbackClass="bg-primary/10 font-heading text-xs font-bold text-primary"
											initials={getInitials(d.name.replace(/^Dr\.?\s*/i, '')).slice(0, 1)}
										/>
										<span class="font-medium text-on-surface">{d.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">{d.specialty}</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">{d.hospital}</td>
								<td class="px-4 py-3 align-middle">
									<span
										class="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
									>
										<Star size={10} class="fill-current" />
										{d.rating}
									</span>
								</td>
								<td class="px-4 py-3 align-middle">
									{#if d.isActive}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-primary"></span> Active
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-outline"
										>
											Inactive
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 align-middle">
									<RowActions name={d.name} onedit={() => crud.openEdit(d)} ondelete={() => crud.askDelete(d)} />
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
				label="doctors"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={crud.modalOpen}
	formId="doctor-form"
	submitLabel={crud.editing ? 'Save Changes' : 'Create'}
	size="lg"
	title={crud.editing ? 'Edit doctor' : 'Add doctor'}
	description={crud.editing ? crud.editing.name : 'Onboard a new physician'}
>
	<form
		id="doctor-form"
		method="POST"
		action={crud.editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: crud.editing ? 'Doctor updated.' : 'Doctor created.',
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
		<DoctorFormFields editing={crud.editing} hospitals={data.hospitals} specialists={data.specialists} />
	</form>

</Modal>

<DeleteConfirm
	bind:open={crud.confirmOpen}
	target={crud.confirmTarget}
	title="Delete doctor?"
	message={`Delete "${crud.confirmTarget?.name ?? ''}"? Their schedules will be removed and existing bookings will lose their doctor reference.`}
	successMessage={`Doctor "${crud.confirmTarget?.name ?? ''}" deleted.`}
	failureMessage="Failed to delete doctor."
	onclose={() => (crud.confirmTarget = null)}
/>
