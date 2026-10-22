import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

const mock = (file: string) => fileURLToPath(new URL(`./src/test/mocks/${file}`, import.meta.url));

// SvelteKit's `$app/*` virtual modules only exist inside the Kit Vite plugin,
// so tests resolve them to controllable stand-ins instead.
const alias = {
	'$app/env/private': mock('env-private.ts'),
	'$app/state': mock('app-state.svelte.ts'),
	'$app/forms': mock('app-forms.ts'),
	'$app/navigation': mock('app-navigation.ts')
};

// The Svelte config lives inside vite.config.ts (sveltekit() plugin), so pass it inline.
const svelteOptions = {
	configFile: false as const,
	compilerOptions: { runes: true }
};

export default defineConfig({
	resolve: { alias },
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			exclude: [
				'src/**/*.test.ts',
				'src/test/**',
				'src/app.d.ts',
				'src/env.ts',
				'src/**/$types.d.ts'
			],
			reporter: ['text-summary', 'text', 'html'],
			thresholds: {
				lines: 90,
				statements: 90,
				functions: 90,
				branches: 90
			}
		},
		projects: [
			{
				extends: true,
				plugins: [svelte(svelteOptions)],
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts'],
					setupFiles: ['src/test/setup-server.ts'],
					testTimeout: 20_000,
					hookTimeout: 30_000
				}
			},
			{
				extends: true,
				plugins: [svelte(svelteOptions), svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/*.svelte.test.ts'],
					setupFiles: ['src/test/setup-client.ts'],
					// Coverage instrumentation slows jsdom renders; 5s default flakes under load.
					testTimeout: 20_000
				}
			}
		]
	}
});
