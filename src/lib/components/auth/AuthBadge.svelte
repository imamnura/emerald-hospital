<script lang="ts">
	import { Leaf, Lock, Plus, RotateCcw, Shield } from '@lucide/svelte';

	interface Props {
		/** `logo` = login shield, `register` = leaf, `reset` = forgot / reset password. */
		variant: 'logo' | 'register' | 'reset';
	}

	let { variant }: Props = $props();

	const FRAME =
		'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-[var(--shadow-card)]';
</script>

{#if variant === 'logo'}
	<div class={FRAME}>
		<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
			<Shield size={22} class="text-on-primary" strokeWidth={2} fill="currentColor" />
			<span
				class="absolute flex h-4 w-4 items-center justify-center rounded-sm bg-on-primary text-primary"
			>
				<Plus size={12} strokeWidth={3} />
			</span>
		</div>
	</div>
{:else if variant === 'register'}
	<div
		class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-primary"
	>
		<Leaf size={28} class="text-on-primary" strokeWidth={2} fill="currentColor" />
	</div>
{:else}
	<div class={FRAME}>
		<div class="relative flex h-10 w-10 items-center justify-center text-primary">
			<RotateCcw size={36} strokeWidth={1.75} />
			<span
				class="absolute flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest"
			>
				<Lock size={12} strokeWidth={2.5} />
			</span>
		</div>
	</div>
{/if}
