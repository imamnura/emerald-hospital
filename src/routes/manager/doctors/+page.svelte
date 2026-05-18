<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Pencil, Plus, Search, Star, Stethoscope, Trash2 } from '@lucide/svelte';
	import ConfirmDialog from '$lib/components/manager/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/manager/EmptyState.svelte';
	import Modal from '$lib/components/manager/Modal.svelte';
	import PageHeader from '$lib/components/manager/PageHeader.svelte';
	import Pagination from '$lib/components/manager/Pagination.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { toastForm } from '$lib/utils/enhance';

	let { data } = $props();
	type Doctor = (typeof data.doctors)[number];

	let modalOpen = $state(false);
	let editing = $state<Doctor | null>(null);

	let searchInput = $state('');
	let hospitalFilter = $state('');
	let specialistFilter = $state('');
	$effect.pre(() => {
		searchInput = data.query;
		hospitalFilter = data.hospitalFilter;
		specialistFilter = data.specialistFilter;
	});

	let confirmOpen = $state(false);
	let confirmTarget = $state<Doctor | null>(null);
	let deleteFormEl: HTMLFormElement;
	let deletingId = $state('');
	let deleting = $state(false);

	function openAdd() {
		editing = null;
		modalOpen = true;
	}

	function openEdit(d: Doctor) {
		editing = d;
		modalOpen = true;
	}

	function askDelete(d: Doctor) {
		confirmTarget = d;
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
		if (hospitalFilter) params.set('hospitalId', hospitalFilter);
		else params.delete('hospitalId');
		if (specialistFilter) params.set('specialistId', specialistFilter);
		else params.delete('specialistId');
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
		const target = confirmTarget;
		confirmTarget = null;
		if (result.type === 'success') toast.success(`Doctor "${target?.name ?? ''}" deleted.`);
		else if (result.type === 'failure')
			toast.error((result.data?.error as string) ?? 'Failed to delete doctor.');
	}}
>
	<input type="hidden" name="id" bind:value={deletingId} />
</form>

<PageHeader
	title="Doctors"
	subtitle="Manage doctor profiles and assignments."
	count={data.total}
	countLabel="total"
>
	{#snippet actions()}
		<button
			type="button"
			onclick={openAdd}
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			<Plus size={16} strokeWidth={2.25} />
			Add Doctor
		</button>
	{/snippet}
</PageHeader>

<div class="mt-6 flex flex-col gap-4">
	<form onsubmit={submitSearch} class="grid gap-2 sm:grid-cols-[1fr,auto,auto,auto]">
		<div class="relative">
			<Search
				size={16}
				class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
			/>
			<input
				type="search"
				name="q"
				bind:value={searchInput}
				placeholder="Search by name, specialty, or hospital"
				class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
			/>
		</div>
		<select
			bind:value={hospitalFilter}
			onchange={applyFilters}
			class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
			aria-label="Filter by hospital"
		>
			<option value="">All hospitals</option>
			{#each data.hospitals as h}
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
			{#each data.specialists as s}
				<option value={s.id}>{s.name}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-primary"
		>
			Apply
		</button>
	</form>

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
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary"
										>
											{d.name.replace(/^Dr\.?\s*/i, '').charAt(0)}
										</span>
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
									<div class="flex justify-end gap-1">
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
											aria-label="Edit {d.name}"
											onclick={() => openEdit(d)}
										>
											<Pencil size={14} />
										</button>
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
											aria-label="Delete {d.name}"
											onclick={() => askDelete(d)}
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
				label="doctors"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={modalOpen}
	size="lg"
	title={editing ? 'Edit doctor' : 'Add doctor'}
	description={editing ? editing.name : 'Onboard a new physician'}
>
	<form
		id="doctor-form"
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: editing ? 'Doctor updated.' : 'Doctor created.',
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
			Full name *
			<input
				name="name"
				required
				value={editing?.name ?? ''}
				placeholder="Dr. Jane Doe"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Hospital *
				<select
					name="hospitalId"
					required
					value={editing?.hospitalId ?? ''}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Select hospital</option>
					{#each data.hospitals as h}
						<option value={h.id}>{h.name}</option>
					{/each}
				</select>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Specialty *
				<select
					name="specialistId"
					required
					value={editing?.specialistId ?? ''}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Select specialty</option>
					{#each data.specialists as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			</label>
		</div>
		<div class="grid gap-3 sm:grid-cols-3">
			<label class="text-xs font-semibold text-on-surface-variant">
				Rating
				<input
					name="rating"
					type="number"
					step="0.1"
					min="0"
					max="5"
					value={editing?.rating ?? '4.5'}
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Consultation fee
				<input
					name="consultationFee"
					type="number"
					step="0.01"
					min="0"
					value={editing?.consultationFee ?? ''}
					placeholder="150.00"
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
			<label class="flex items-center gap-2 text-xs font-semibold text-on-surface-variant pt-5">
				<input
					type="checkbox"
					name="isActive"
					checked={editing ? editing.isActive : true}
					class="h-4 w-4 rounded border-outline-variant accent-primary"
				/>
				Active
			</label>
		</div>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Image URL
			<input
				name="imageUrl"
				value={editing?.imageUrl ?? ''}
				placeholder="https://…"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</label>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Bio
			<textarea
				name="bio"
				rows="3"
				value={editing?.bio ?? ''}
				placeholder="Short professional bio shown to patients."
				class="mt-1 w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			></textarea>
		</label>
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
			form="doctor-form"
			class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			{editing ? 'Save Changes' : 'Create'}
		</button>
	{/snippet}
</Modal>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete doctor?"
	message={`Delete "${confirmTarget?.name ?? ''}"? Their schedules will be removed and existing bookings will lose their doctor reference.`}
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => (confirmTarget = null)}
/>
