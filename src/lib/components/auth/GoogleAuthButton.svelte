<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cn } from '#lib/utils.ts';

	interface Props {
		href: string;
		enabled: boolean;
		/** Button text, e.g. "Sign in with Google". */
		label: string;
		/** Extra classes (spacing / shadow differ per page). */
		class?: string;
		/** Fade/slide the button in (login page). */
		animateIn?: boolean;
	}

	let { href, enabled, label, class: className, animateIn = false }: Props = $props();

	const intro = $derived({ y: 12, duration: animateIn ? 380 : 0, delay: 200 });
</script>

{#if enabled}
	<a
		{href}
		data-sveltekit-preload-data="off"
		class={cn(
			'flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 text-sm font-bold text-on-surface transition hover:bg-surface-container active:scale-[0.98]',
			className
		)}
		in:fly={intro}
	>
		<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
		{label}
	</a>
{:else}
	<button
		type="button"
		disabled
		class={cn(
			'flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 text-sm font-bold text-outline opacity-60',
			className
		)}
		title="Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable"
		in:fly={intro}
	>
		{label} (not configured)
	</button>
{/if}
