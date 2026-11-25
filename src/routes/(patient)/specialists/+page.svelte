<script lang="ts">
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import ProfileLink from '#lib/components/profile/ProfileLink.svelte';
	import SpecialistTile from '#lib/components/specialist/SpecialistTile.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();
</script>

<BackHeader title="All Specialists" backHref="/home">
	{#snippet trailing()}
		<ProfileLink imageUrl={data.user?.imageUrl} name={data.user?.name ?? 'Guest'} />
	{/snippet}
</BackHeader>

<MotionReveal delay={80}>
<div class="mt-6 grid grid-cols-3 gap-3">
	{#each data.specialists as spec (spec.id)}
		<SpecialistTile
			name={spec.name}
			icon={spec.icon}
			href="/specialists/{spec.slug}"
			variant="card"
		/>
	{/each}
</div>

{#if data.specialists.length === 0}
	<p class="mt-12 text-center text-sm text-outline">No specialists available yet.</p>
{/if}
</MotionReveal>
