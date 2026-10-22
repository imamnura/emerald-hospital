<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import CardBrandBadge from './CardBrandBadge.svelte';
	import { formatCardNumber, type SavedCardView } from '#lib/utils/payments.ts';
	import { cn } from '#lib/utils.ts';

	interface Props {
		card: SavedCardView;
		onDelete?: () => void;
		onSetDefault?: () => void;
	}

	let { card, onDelete, onSetDefault }: Props = $props();
</script>

<article
	class={cn(
		'relative flex items-center gap-3 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-4 shadow-[var(--shadow-card)]',
		card.isDefault && 'border-primary/20'
	)}
>
	{#if card.isDefault}
		<div class="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" aria-hidden="true"></div>
	{/if}

	<CardBrandBadge brand={card.brand} />

	<button
		type="button"
		class="min-w-0 flex-1 text-left"
		disabled={card.isDefault}
		onclick={() => !card.isDefault && onSetDefault?.()}
	>
		<p class="font-medium text-on-surface">{formatCardNumber(card.last4)}</p>
		<p class="mt-0.5 text-xs text-outline">Expires {card.expires}</p>
	</button>

	{#if card.isDefault}
		<span class="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-on-primary">
			Default
		</span>
	{:else}
		<button
			type="button"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container hover:text-error"
			aria-label="Remove card"
			onclick={() => onDelete?.()}
		>
			<Trash2 size={18} />
		</button>
	{/if}
</article>
