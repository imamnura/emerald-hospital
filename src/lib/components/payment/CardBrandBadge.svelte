<script lang="ts">
	import type { CardBrand } from '$lib/utils/payments';

	interface Props {
		brand: CardBrand;
	}

	let { brand }: Props = $props();
</script>

<div
	class="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-outline-variant/40 bg-surface-container"
>
	{#if brand === 'visa'}
		<span class="text-[10px] font-black tracking-tight text-[#1a1f71]">VISA</span>
	{:else}
		<div class="flex items-center -space-x-1.5" aria-label="Mastercard">
			<span class="h-4 w-4 rounded-full bg-[#eb001b]"></span>
			<span class="h-4 w-4 rounded-full bg-[#f79e1b]"></span>
		</div>
	{/if}
</div>
