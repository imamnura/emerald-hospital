<script lang="ts">
	import SearchPageHeader from '#lib/components/SearchPageHeader.svelte';
	import SpecialistGridCard from '#lib/components/SpecialistGridCard.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();
</script>

<SearchPageHeader
	title="All Specialists"
	backHref="/home"
	userName={data.user?.name ?? 'Guest'}
	userImage={data.user?.imageUrl}
/>

<MotionReveal delay={80}>
<div class="mt-6 grid grid-cols-3 gap-3">
	{#each data.specialists as spec (spec.id)}
		<SpecialistGridCard name={spec.name} slug={spec.slug} icon={spec.icon} />
	{/each}
</div>

{#if data.specialists.length === 0}
	<p class="mt-12 text-center text-sm text-outline">No specialists available yet.</p>
{/if}
</MotionReveal>
