<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import {
		ChevronDown,
		ChevronRight,
		Info,
		Mail,
		MessageCircle,
		MessageCircleQuestion,
		Phone
	} from '@lucide/svelte';
	import HelpContactCard from '#lib/components/HelpContactCard.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import SearchBar from '#lib/components/SearchBar.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import {
		APP_VERSION,
		contactOptions,
		popularFaqs,
		SUPPORT_EMAIL,
		SUPPORT_PHONE
	} from '#lib/data/help-support.ts';

	let searchQuery = $state('');
	let notice = $state<string | null>(null);
	let openFaq = $state<string | null>(null);

	let noticeTimer: ReturnType<typeof setTimeout> | undefined;
	function showNotice(text: string) {
		notice = text;
		clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => (notice = null), 5000);
	}

	const filteredFaqs = $derived(
		searchQuery.trim()
			? popularFaqs.filter((q) => q.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			: [...popularFaqs]
	);

	function scrollToFaqs() {
		document.getElementById('popular-faqs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function handleContactAction(action: (typeof contactOptions)[number]['action']) {
		switch (action) {
			case 'scroll-faqs':
				scrollToFaqs();
				break;
			case 'chat':
				showNotice('Live chat is not available yet. Try Call Center or Email Us in the meantime.');
				break;
			case 'call':
				window.location.href = `tel:${SUPPORT_PHONE}`;
				break;
			case 'email':
				window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Emerald%20Hospital%20Support`;
				break;
		}
	}

	function toggleFaq(question: string) {
		openFaq = openFaq === question ? null : question;
	}
</script>

<BackHeader title="Help & Support" backHref="/profile" divider dividerClass="mb-5" />

<MotionReveal delay={50}>
	<SearchBar
		bind:value={searchQuery}
		placeholder="Search for help or FAQs..."
		name="help-q"
		rounded="2xl"
	/>
</MotionReveal>

{#if notice}
	<div
		class="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-on-surface-variant"
		transition:slide={{ duration: 200 }}
	>
		<Info size={14} class="mt-0.5 shrink-0 text-primary" />
		<p>{notice}</p>
	</div>
{/if}

<MotionReveal delay={100}>
	<p class="mt-6 text-xs font-semibold uppercase tracking-wide text-primary/80">Contact Options</p>
	<div class="mt-3 grid grid-cols-2 gap-3">
		{#each contactOptions as option, i (option.title)}
			<div in:fly={{ y: 12, duration: 320, delay: i * 50 }}>
				<HelpContactCard
					title={option.title}
					description={option.description}
					onclick={() => handleContactAction(option.action)}
				>
					{#snippet icon()}
						{#if option.action === 'scroll-faqs'}
							<MessageCircleQuestion size={20} strokeWidth={2} />
						{:else if option.action === 'chat'}
							<MessageCircle size={20} strokeWidth={2} />
						{:else if option.action === 'call'}
							<Phone size={20} strokeWidth={2} />
						{:else}
							<Mail size={20} strokeWidth={2} />
						{/if}
					{/snippet}
				</HelpContactCard>
			</div>
		{/each}
	</div>
</MotionReveal>

<MotionReveal delay={160}>
	<p id="popular-faqs" class="mt-8 text-xs font-semibold uppercase tracking-wide text-primary/80">
		Popular FAQs
	</p>
	<div
		class="mt-3 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-[var(--shadow-card)]"
	>
		{#if filteredFaqs.length === 0}
			<p class="px-4 py-6 text-center text-sm text-outline" in:fade={{ duration: 200 }}>
				No FAQs match your search.
			</p>
		{:else}
			{#each filteredFaqs as question, i (question)}
				{@const expanded = openFaq === question}
				<button
					type="button"
					class="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container"
					in:fly={{ y: 8, duration: 280, delay: i * 40 }}
					aria-expanded={expanded}
					onclick={() => toggleFaq(question)}
				>
					<span class="text-sm font-medium text-on-surface">{question}</span>
					{#if expanded}
						<ChevronDown size={18} class="shrink-0 text-primary" />
					{:else}
						<ChevronRight size={18} class="shrink-0 text-outline" />
					{/if}
				</button>
				{#if expanded}
					<div
						class="border-t border-outline-variant/35 bg-surface-container-low/50 px-4 py-3"
						transition:slide={{ duration: 200 }}
					>
						<p class="text-xs leading-relaxed text-on-surface-variant">
							We're preparing a detailed answer for this question. For immediate help, please
							<a href="tel:{SUPPORT_PHONE}" class="font-semibold text-primary">call support</a>
							or
							<a href="mailto:{SUPPORT_EMAIL}" class="font-semibold text-primary">send us an email</a>.
						</p>
					</div>
				{/if}
				{#if i < filteredFaqs.length - 1}
					<div class="mx-4 border-t border-outline-variant/35"></div>
				{/if}
			{/each}
		{/if}
	</div>
</MotionReveal>

<p class="mt-10 pb-4 text-center text-xs text-outline">Version {APP_VERSION}</p>
