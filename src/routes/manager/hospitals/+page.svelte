<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Building2, Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
	import ConfirmDialog from '#lib/components/manager/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/manager/EmptyState.svelte';
	import Modal from '#lib/components/manager/Modal.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/manager/Pagination.svelte';
	import { toast } from '#lib/stores/toast.svelte.ts';
	import { toastForm } from '#lib/utils/enhance.ts';

	let { data } = $props();
	type Hospital = (typeof data.hospitals)[number];

	let modalOpen = $state(false);
	let editing = $state<Hospital | null>(null);

	let searchInput = $state('');
	$effect.pre(() => {
		searchInput = data.query;
	});

	let confirmOpen = $state(false);
	let confirmTarget = $state<Hospital | null>(null);
	let deleteFormEl: HTMLFormElement;
	let deletingId = $state('');
	let deleting = $state(false);

	function openAdd() {
		editing = null;
		modalOpen = true;
	}

	function openEdit(h: Hospital) {
		editing = h;
		modalOpen = true;
	}

	function askDelete(h: Hospital) {
		confirmTarget = h;
		confirmOpen = true;
	}

	async function confirmDelete() {
		if (!confirmTarget) return;
		deletingId = confirmTarget.id;
		deleting = true;
		// Let bind:value write the id into the hidden input before submitting.
		await tick();
		deleteFormEl.requestSubmit();
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
</script>

<!-- Hidden delete form (driven by ConfirmDialog) -->
<form
	method="POST"
	action="?/delete"
	bind:this={deleteFormEl}
	class="hidden"
	use:enhance={() => async ({ result, update }) => {
		await update({ refreshAll: true });
		deleting = false;
		confirmOpen = false;
		const target = confirmTarget;
		confirmTarget = null;
		if (result.type === 'success') toast.success(`Hospital "${target?.name ?? ''}" deleted.`);
		else if (result.type === 'failure')
			toast.error((result.data?.error as string) ?? 'Failed to delete hospital.');
	}}
>
	<input type="hidden" name="id" bind:value={deletingId} />
</form>

<PageHeader
	title="Hospitals"
	subtitle="Manage partner facilities and their contact details."
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
			Add Hospital
		</button>
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
			placeholder="Search by name, city, or address (press Enter)"
			class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
		/>
	</form>

	{#if data.hospitals.length === 0}
		<EmptyState
			title={data.query ? 'No hospitals match your search' : 'No hospitals yet'}
			description={data.query
				? 'Try a different keyword.'
				: 'Add your first hospital to get started.'}
		>
			{#snippet icon()}
				<Building2 size={24} strokeWidth={2} />
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
							<th class="px-4 py-3">Name</th>
							<th class="px-4 py-3">Location</th>
							<th class="px-4 py-3">Contact</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.hospitals as h, i (h.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex items-center gap-2.5">
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
										>
											<Building2 size={14} strokeWidth={2} />
										</span>
										<span class="font-medium text-on-surface">{h.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">
									<p>{h.city}</p>
									<p class="text-xs text-outline">{h.address}</p>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									{h.contact ?? '—'}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex justify-end gap-1">
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
											aria-label="Edit {h.name}"
											onclick={() => openEdit(h)}
										>
											<Pencil size={14} />
										</button>
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
											aria-label="Delete {h.name}"
											onclick={() => askDelete(h)}
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
				label="hospitals"
			/>
		</div>
	{/if}
</div>

<!-- Add / Edit modal -->
<Modal
	bind:open={modalOpen}
	title={editing ? 'Edit hospital' : 'Add hospital'}
	description={editing ? editing.name : 'Create a new partner facility'}
>
	<form
		id="hospital-form"
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: editing ? 'Hospital updated.' : 'Hospital created.',
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
			Hospital name *
			<input
				name="name"
				required
				value={editing?.name ?? ''}
				placeholder="Central Health Hospital"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				City *
				<input
					name="city"
					required
					value={editing?.city ?? ''}
					placeholder="Jakarta"
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Contact
				<input
					name="contact"
					value={editing?.contact ?? ''}
					placeholder="+62211234567"
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
		</div>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Address *
			<input
				name="address"
				required
				value={editing?.address ?? ''}
				placeholder="Jl. Sudirman No. 45"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</label>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Image URL
			<input
				name="imageUrl"
				value={editing?.imageUrl ?? ''}
				placeholder="https://…"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
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
			form="hospital-form"
			class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			{editing ? 'Save Changes' : 'Create'}
		</button>
	{/snippet}
</Modal>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete hospital?"
	message={`Delete "${confirmTarget?.name ?? ''}"? Doctors assigned here will need to be reassigned. This cannot be undone.`}
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => (confirmTarget = null)}
/>
