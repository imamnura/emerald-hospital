<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Pencil, Plus, Search, Sparkles, Trash2 } from '@lucide/svelte';
	import ConfirmDialog from '$lib/components/manager/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/manager/EmptyState.svelte';
	import Modal from '$lib/components/manager/Modal.svelte';
	import PageHeader from '$lib/components/manager/PageHeader.svelte';
	import Pagination from '$lib/components/manager/Pagination.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { toastForm } from '$lib/utils/enhance';

	let { data } = $props();
	type Specialist = (typeof data.specialists)[number];

	let modalOpen = $state(false);
	let editing = $state<Specialist | null>(null);

	let searchInput = $state('');
	$effect.pre(() => {
		searchInput = data.query;
	});

	let confirmOpen = $state(false);
	let confirmTarget = $state<Specialist | null>(null);
	let deleteFormEl: HTMLFormElement;
	let deletingId = $state('');
	let deleting = $state(false);

	function openAdd() {
		editing = null;
		modalOpen = true;
	}

	function openEdit(s: Specialist) {
		editing = s;
		modalOpen = true;
	}

	function askDelete(s: Specialist) {
		confirmTarget = s;
		confirmOpen = true;
	}

	function confirmDelete() {
		if (!confirmTarget) return;
		deletingId = confirmTarget.id;
		deleting = true;
		deleteFormEl.requestSubmit();
	}

	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		const params = new URLSearchParams(page.url.searchParams);
		const q = searchInput.trim();
		if (q) params.set('q', q);
		else params.delete('q');
		params.delete('page');
		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname, { keepFocus: true });
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
		if (result.type === 'success') toast.success(`Specialty "${target?.name ?? ''}" deleted.`);
		else if (result.type === 'failure')
			toast.error((result.data?.error as string) ?? 'Failed to delete specialty.');
	}}
>
	<input type="hidden" name="id" bind:value={deletingId} />
</form>

<PageHeader
	title="Specialists"
	subtitle="Manage the medical specialties shown to patients."
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
			Add Specialty
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
			placeholder="Search specialties (press Enter)"
			class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
		/>
	</form>

	{#if data.specialists.length === 0}
		<EmptyState
			title={data.query ? 'No specialties found' : 'No specialties yet'}
			description={data.query
				? 'Try a different keyword.'
				: 'Add medical specialties so doctors can be categorized.'}
		>
			{#snippet icon()}
				<Sparkles size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[560px] text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Specialty</th>
							<th class="px-4 py-3">Slug</th>
							<th class="px-4 py-3">Icon</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.specialists as s, i (s.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex items-center gap-2.5">
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
										>
											<Sparkles size={14} strokeWidth={2} />
										</span>
										<span class="font-medium text-on-surface">{s.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									<code class="rounded bg-surface-container px-1.5 py-0.5">{s.slug}</code>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									{s.icon ?? '—'}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex justify-end gap-1">
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
											aria-label="Edit {s.name}"
											onclick={() => openEdit(s)}
										>
											<Pencil size={14} />
										</button>
										<button
											type="button"
											class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
											aria-label="Delete {s.name}"
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
				label="specialties"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={modalOpen}
	title={editing ? 'Edit specialty' : 'Add specialty'}
	description={editing ? editing.name : 'Create a new medical specialty category'}
>
	<form
		id="specialist-form"
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: editing ? 'Specialty updated.' : 'Specialty created.',
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
			Display name *
			<input
				name="name"
				required
				value={editing?.name ?? ''}
				placeholder="Cardiology"
				class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				URL slug *
				<input
					name="slug"
					required
					value={editing?.slug ?? ''}
					pattern="[a-z0-9-]+"
					placeholder="cardiology"
					class="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Icon key
				<input
					name="icon"
					value={editing?.icon ?? ''}
					placeholder="heart, eye, dental…"
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
			form="specialist-form"
			class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
		>
			{editing ? 'Save Changes' : 'Create'}
		</button>
	{/snippet}
</Modal>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete specialty?"
	message={`Delete "${confirmTarget?.name ?? ''}"? Doctors in this specialty will need to be reassigned.`}
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={confirmDelete}
	onCancel={() => (confirmTarget = null)}
/>
