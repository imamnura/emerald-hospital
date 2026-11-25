<script lang="ts">
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { getInitials } from '#lib/format/text.ts';
	import SpecialistGridCard from '#lib/components/SpecialistGridCard.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();
</script>

<BackHeader title="All Specialists" backHref="/home">
	{#snippet trailing()}
		{#if data.user?.imageUrl}
			<Avatar src={data.user?.imageUrl} name={data.user?.name ?? 'Guest'} size="md" />
		{:else}
			<a
				href="/profile"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary"
			>
				{getInitials(data.user?.name ?? 'Guest')}
			</a>
		{/if}
	{/snippet}
</BackHeader>

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
