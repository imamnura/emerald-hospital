<script lang="ts">
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import {
		ArrowLeftRight,
		CalendarClock,
		LayoutDashboard,
		LogOut,
		Menu,
		Stethoscope,
		Sparkles,
		Building2,
		ClipboardList,
		X
	} from '@lucide/svelte';
	import { cn } from '#lib/utils.ts';

	let { children, data } = $props();

	type NavItem = {
		href: string;
		label: string;
		Icon: typeof LayoutDashboard;
		exact?: boolean;
	};

	const nav: NavItem[] = [
		{ href: '/manager', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
		{ href: '/manager/hospitals', label: 'Hospitals', Icon: Building2 },
		{ href: '/manager/specialists', label: 'Specialists', Icon: Sparkles },
		{ href: '/manager/doctors', label: 'Doctors', Icon: Stethoscope },
		{ href: '/manager/schedules', label: 'Schedules', Icon: CalendarClock },
		{ href: '/manager/bookings', label: 'Bookings', Icon: ClipboardList }
	];

	let drawerOpen = $state(false);

	const path = $derived(page.url.pathname);

	function isActive(href: string, exact?: boolean): boolean {
		if (exact) return path === href;
		return path === href || path.startsWith(href + '/');
	}

</script>

<div class="min-h-screen bg-surface">
	<!-- Mobile top bar -->
	<header
		class="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-md lg:hidden"
	>
		<button
			type="button"
			class="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface-container"
			aria-label="Open navigation"
			onclick={() => (drawerOpen = true)}
		>
			<Menu size={22} />
		</button>
		<div class="text-center">
			<p class="font-heading text-sm font-bold text-primary">Emerald Manager</p>
			<p class="text-[10px] text-outline">{data.user.name}</p>
		</div>
		<a
			href="/home"
			class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
			aria-label="Patient app"
			title="Switch to patient app"
		>
			<ArrowLeftRight size={18} />
		</a>
	</header>

	<div class="flex">
		<!-- Sidebar (desktop / tablet) -->
		<aside
			class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-lowest lg:flex"
		>
			<div class="flex items-center gap-3 border-b border-outline-variant/30 px-5 py-5">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-primary"
				>
					<Sparkles size={20} />
				</div>
				<div>
					<p class="font-heading text-base font-bold text-primary">Emerald</p>
					<p class="-mt-0.5 text-xs text-outline">Manager Console</p>
				</div>
			</div>

			<nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Manager navigation">
				<ul class="flex flex-col gap-1">
					{#each nav as item}
						{@const active = isActive(item.href, item.exact)}
						<li>
							<a
								href={item.href}
								class={cn(
									'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
									active
										? 'bg-primary text-on-primary shadow-primary'
										: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
								)}
							>
								<item.Icon size={18} strokeWidth={active ? 2.5 : 2} />
								<span>{item.label}</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="border-t border-outline-variant/30 px-3 py-4">
				<a
					href="/home"
					class="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
				>
					<ArrowLeftRight size={14} />
					Open patient app
				</a>
				<div class="flex items-center gap-3 rounded-xl bg-surface-container px-3 py-2.5">
					<Avatar
						name={data.user.name}
						class="h-9 w-9 shrink-0"
						fallbackClass="bg-primary/15 font-heading text-sm font-bold text-primary"
					/>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-on-surface">{data.user.name}</p>
						<p class="truncate text-[10px] text-outline">{data.user.email}</p>
					</div>
					<form method="POST" action="/profile?/logout" use:enhance>
						<button
							type="submit"
							class="flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error-container hover:text-error"
							aria-label="Sign out"
							title="Sign out"
						>
							<LogOut size={16} />
						</button>
					</form>
				</div>
			</div>
		</aside>

		<!-- Mobile drawer -->
		{#if drawerOpen}
			<button
				type="button"
				class="fixed inset-0 z-40 bg-on-surface/50 backdrop-blur-sm lg:hidden"
				aria-label="Close navigation"
				onclick={() => (drawerOpen = false)}
			></button>
			<aside
				class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface-container-lowest shadow-2xl lg:hidden"
			>
				<div class="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary"
						>
							<Sparkles size={20} />
						</div>
						<div>
							<p class="font-heading text-base font-bold text-primary">Emerald</p>
							<p class="-mt-0.5 text-xs text-outline">Manager Console</p>
						</div>
					</div>
					<button
						type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
						aria-label="Close"
						onclick={() => (drawerOpen = false)}
					>
						<X size={18} />
					</button>
				</div>
				<nav class="flex-1 overflow-y-auto px-3 py-4">
					<ul class="flex flex-col gap-1">
						{#each nav as item}
							{@const active = isActive(item.href, item.exact)}
							<li>
								<a
									href={item.href}
									onclick={() => (drawerOpen = false)}
									class={cn(
										'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
										active
											? 'bg-primary text-on-primary'
											: 'text-on-surface-variant hover:bg-surface-container'
									)}
								>
									<item.Icon size={18} />
									<span>{item.label}</span>
								</a>
							</li>
						{/each}
					</ul>
				</nav>
				<div class="border-t border-outline-variant/30 p-3">
					<form method="POST" action="/profile?/logout" use:enhance>
						<button
							type="submit"
							class="flex w-full items-center justify-center gap-2 rounded-xl bg-error-container/60 py-2.5 text-sm font-semibold text-error"
						>
							<LogOut size={16} />
							Sign out
						</button>
					</form>
				</div>
			</aside>
		{/if}

		<main class="min-w-0 flex-1">
			<div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>
