<script lang="ts">
	import { page } from '$app/state';
	import { Calendar, Home, User } from '@lucide/svelte';
	import { cn } from '#lib/utils.ts';

	const items = [
		{ href: '/home', label: 'Home', icon: Home },
		{ href: '/appointments', label: 'Appointments', icon: Calendar },
		{ href: '/profile', label: 'Profile', icon: User }
	];
</script>

<nav
	class="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-3"
>
	<div class="flex items-center justify-around">
		{#each items as item}
			{@const active = page.url.pathname === item.href}
			<a href={item.href} class="flex flex-col items-center gap-1 transition-transform active:scale-95">
				<span
					class={cn(
						'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
						active ? 'scale-105 bg-primary text-on-primary shadow-primary' : 'text-outline'
					)}
				>
					<item.icon size={20} strokeWidth={active ? 2.5 : 2} />
				</span>
				<span
					class={cn(
						'text-xs font-medium',
						active ? 'text-primary' : 'text-outline'
					)}
				>
					{item.label}
				</span>
			</a>
		{/each}
	</div>
</nav>
