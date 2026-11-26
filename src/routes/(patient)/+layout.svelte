<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '#lib/components/layout/BottomNav.svelte';
	import PageEnter from '#lib/components/motion/PageEnter.svelte';

	let { children } = $props();

	const hideNav = $derived(
		page.url.pathname.includes('/doctors/') && page.url.pathname.includes('/book')
	);
</script>

<div class="mx-auto min-h-screen max-w-md bg-surface">
	<main class="px-5 pb-28 pt-5">
		<PageEnter pageKey={page.url.pathname}>
			{@render children()}
		</PageEnter>
	</main>
	{#if !hideNav}
		<BottomNav />
	{/if}
</div>
