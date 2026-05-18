<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import AuthLogo from '$lib/components/auth/AuthLogo.svelte';

	let { data, form } = $props();

	const googleHref = $derived(
		data.redirectTo
			? `/login/google?redirect=${encodeURIComponent(data.redirectTo)}`
			: '/login/google'
	);
</script>

<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-surface px-6 py-10">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthLogo />
		<h1 class="mt-6 font-heading text-2xl font-bold text-on-surface">Purwakarta Health</h1>
		<p class="mt-2 text-sm text-on-surface-variant">Welcome back. Please enter your details.</p>
	</div>

	<form
		method="POST"
		use:enhance
		class="mt-8 space-y-5"
		in:fly={{ y: 16, duration: 420, delay: 80 }}
	>
		{#if data.redirectTo}
			<input type="hidden" name="redirect" value={data.redirectTo} />
		{/if}

		{#if form?.error}
			<p class="rounded-xl bg-error-container px-4 py-3 text-sm text-error">{form.error}</p>
		{:else if data.errorMsg}
			<p class="rounded-xl bg-error-container px-4 py-3 text-sm text-error">{data.errorMsg}</p>
		{/if}

		<div>
			<label for="email" class="mb-1.5 block text-sm font-semibold text-on-surface">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				autocomplete="email"
				placeholder="Enter your email"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<div>
			<div class="mb-1.5 flex items-center justify-between gap-2">
				<label for="password" class="text-sm font-semibold text-on-surface">Password</label>
				<a href="/login/forgot" class="text-sm font-medium text-primary">Forgot Password?</a>
			</div>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="current-password"
				placeholder="••••••••"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
		>
			Sign In
		</button>
	</form>

	<div class="mt-6 flex items-center gap-3" in:fly={{ y: 12, duration: 380, delay: 160 }}>
		<div class="h-px flex-1 bg-outline-variant/50"></div>
		<span class="text-xs font-medium text-outline">OR</span>
		<div class="h-px flex-1 bg-outline-variant/50"></div>
	</div>

	{#if data.googleEnabled}
		<a
			href={googleHref}
			data-sveltekit-preload-data="off"
			class="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3.5 text-sm font-bold text-on-surface shadow-[var(--shadow-card)] transition hover:bg-surface-container active:scale-[0.98]"
			in:fly={{ y: 12, duration: 380, delay: 200 }}
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
			Sign in with Google
		</a>
	{:else}
		<button
			type="button"
			disabled
			class="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 text-sm font-bold text-outline opacity-60"
			title="Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable"
			in:fly={{ y: 12, duration: 380, delay: 200 }}
		>
			Sign in with Google (not configured)
		</button>
	{/if}

	<p class="mt-8 text-center text-sm text-on-surface-variant">
		Don't have an account?
		<a href="/register" class="font-bold text-primary">Register</a>
	</p>
</div>
