<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { Eye, EyeOff, Lock, Mail, User } from '@lucide/svelte';
	import AuthRegisterLogo from '#lib/components/auth/AuthRegisterLogo.svelte';

	let { data, form } = $props();

	let showPassword = $state(false);
</script>

<div class="mx-auto min-h-screen max-w-md bg-surface px-6 py-8">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthRegisterLogo />
		<h1 class="mt-5 font-heading text-2xl font-bold text-primary">Purwakarta Health</h1>
		<p class="mt-2 text-sm text-on-surface-variant">Create your account to get started.</p>
	</div>

	<div
		class="mt-8 rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
		in:fly={{ y: 16, duration: 420, delay: 80 }}
	>
		{#if data.googleEnabled}
			<a
				href="/login/google"
				data-sveltekit-preload-data="off"
				class="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 text-sm font-bold text-on-surface transition hover:bg-surface-container active:scale-[0.98]"
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
				Sign up with Google
			</a>
		{:else}
			<button
				type="button"
				disabled
				class="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 text-sm font-bold text-outline opacity-60"
				title="Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable"
			>
				Sign up with Google (not configured)
			</button>
		{/if}

		<div class="my-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-outline-variant/50"></div>
			<span class="text-[10px] font-semibold uppercase tracking-wide text-outline">
				Or register with email
			</span>
			<div class="h-px flex-1 bg-outline-variant/50"></div>
		</div>

		<form method="POST" use:enhance class="space-y-4">
			<FormAlert message={form?.error} />

			<div>
				<label for="name" class="mb-1.5 block text-sm font-semibold text-on-surface">Full Name</label>
				<div class="relative">
					<User
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="name"
						name="name"
						required
						autocomplete="name"
						placeholder="Jane Doe"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 pl-10 pr-4 text-sm placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			<div>
				<label for="email" class="mb-1.5 block text-sm font-semibold text-on-surface">
					Email Address
				</label>
				<div class="relative">
					<Mail
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						placeholder="jane@example.com"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 pl-10 pr-4 text-sm placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="mb-1.5 block text-sm font-semibold text-on-surface">
					Password
				</label>
				<div class="relative">
					<Lock
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						required
						minlength="8"
						autocomplete="new-password"
						placeholder="••••••••"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 pl-10 pr-11 text-sm placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff size={18} />
						{:else}
							<Eye size={18} />
						{/if}
					</button>
				</div>
				<p class="mt-1.5 text-xs text-outline">Must be at least 8 characters.</p>
			</div>

			<button
				type="submit"
				class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
			>
				Create Account
			</button>
		</form>
	</div>

	<p class="mt-6 text-center text-xs leading-relaxed text-on-surface-variant">
		By creating an account, you agree to our
		<a href="/terms" class="font-bold text-primary">Terms of Service</a>
		and
		<a href="/privacy" class="font-bold text-primary">Privacy Policy</a>.
	</p>

	<p class="mt-4 pb-6 text-center text-sm text-on-surface-variant">
		Already have an account?
		<a href="/login" class="font-bold text-primary">Log in</a>
	</p>
</div>
