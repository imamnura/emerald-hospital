<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { Eye, EyeOff, Lock, Mail, User } from '@lucide/svelte';
	import AuthBadge from '#lib/components/auth/AuthBadge.svelte';
	import GoogleAuthButton from '#lib/components/auth/GoogleAuthButton.svelte';

	let { data, form } = $props();

	let showPassword = $state(false);
</script>

<div class="mx-auto min-h-screen max-w-md bg-surface px-6 py-8">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthBadge variant="register" />
		<h1 class="mt-5 font-heading text-2xl font-bold text-primary">Purwakarta Health</h1>
		<p class="mt-2 text-sm text-on-surface-variant">Create your account to get started.</p>
	</div>

	<div
		class="mt-8 rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
		in:fly={{ y: 16, duration: 420, delay: 80 }}
	>
		<GoogleAuthButton href="/login/google" enabled={data.googleEnabled} label="Sign up with Google" />

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
