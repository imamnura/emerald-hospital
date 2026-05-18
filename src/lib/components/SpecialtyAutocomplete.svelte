<script lang="ts" module>
	let nextId = 0;
</script>

<script lang="ts">
	import { Stethoscope } from '@lucide/svelte';

	type SpecialistSuggestion = { name: string; slug: string };

	interface Props {
		value: string;
		placeholder?: string;
		class?: string;
		inputId?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Specialty',
		class: className = '',
		inputId
	}: Props = $props();

	const uid = nextId++;
	const listboxId = $derived(
		inputId ? `${inputId}-suggestions` : `specialty-suggestions-${uid}`
	);

	let suggestions = $state<SpecialistSuggestion[]>([]);
	let suggestionsOpen = $state(false);
	let activeIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let suggestionsToken = 0;

	async function fetchSuggestions(query: string) {
		const token = ++suggestionsToken;
		try {
			const res = await fetch(`/api/specialists?q=${encodeURIComponent(query)}&limit=8`);
			if (!res.ok) return;
			const data: SpecialistSuggestion[] = await res.json();
			if (token !== suggestionsToken) return;
			suggestions = data;
			suggestionsOpen = data.length > 0;
			activeIndex = -1;
		} catch {
			// network errors are silent — user can still submit the form
		}
	}

	function onInput() {
		clearTimeout(debounceTimer);
		const q = value.trim();
		if (!q) {
			suggestions = [];
			suggestionsOpen = false;
			suggestionsToken++;
			return;
		}
		debounceTimer = setTimeout(() => fetchSuggestions(q), 250);
	}

	function selectItem(name: string) {
		value = name;
		suggestionsOpen = false;
		suggestions = [];
		activeIndex = -1;
	}

	function onFocus() {
		if (suggestions.length > 0) suggestionsOpen = true;
	}

	function onBlur() {
		setTimeout(() => {
			suggestionsOpen = false;
		}, 120);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!suggestionsOpen || suggestions.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % suggestions.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			selectItem(suggestions[activeIndex].name);
		} else if (e.key === 'Escape') {
			suggestionsOpen = false;
			activeIndex = -1;
		}
	}
</script>

<label class="relative {className}">
	<span class="sr-only">{placeholder}</span>
	<Stethoscope
		size={18}
		class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
	/>
	<input
		id={inputId}
		type="text"
		bind:value
		oninput={onInput}
		onfocus={onFocus}
		onblur={onBlur}
		onkeydown={onKeydown}
		{placeholder}
		role="combobox"
		aria-expanded={suggestionsOpen}
		aria-controls={listboxId}
		aria-autocomplete="list"
		autocomplete="off"
		class="w-full rounded-xl border border-outline-variant/50 bg-surface py-3 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
	/>
	{#if suggestionsOpen && suggestions.length > 0}
		<ul
			id={listboxId}
			role="listbox"
			class="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-1 shadow-[var(--shadow-card)]"
		>
			{#each suggestions as s, i (s.slug)}
				<li role="presentation">
					<button
						type="button"
						role="option"
						aria-selected={i === activeIndex}
						onmousedown={(e) => e.preventDefault()}
						onclick={() => selectItem(s.name)}
						onmouseenter={() => (activeIndex = i)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-on-surface transition-colors {i ===
						activeIndex
							? 'bg-primary/10 text-primary'
							: 'hover:bg-surface-container'}"
					>
						<Stethoscope size={14} class="shrink-0 text-outline" />
						<span class="truncate">{s.name}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</label>
