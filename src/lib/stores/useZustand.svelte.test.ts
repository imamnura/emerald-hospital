import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { useZustand } from '#lib/stores/useZustand.svelte.ts';
import UseZustandHarness from '../../test/harness/UseZustandHarness.svelte';

type Counter = { count: number; inc: () => void };
const makeCounter = () =>
	createStore<Counter>()((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }));

describe('useZustand', () => {
	it('returns the current store state', () => {
		const store = makeCounter();
		store.getState().inc();
		let state: Counter | undefined;
		const cleanup = $effect.root(() => {
			state = useZustand(store);
		});
		expect(state?.count).toBe(1);
		cleanup();
	});

	it('subscribes while the effect is alive and unsubscribes on teardown', () => {
		const store = makeCounter();
		const unsub = vi.fn();
		const listeners: Array<(s: Counter, p: Counter) => void> = [];
		const subscribe = vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
			listeners.push(listener);
			return unsub;
		});

		const cleanup = $effect.root(() => {
			useZustand(store);
		});
		flushSync();
		expect(subscribe).toHaveBeenCalledOnce();
		// Pushing a new state through the listener must not throw.
		expect(() => listeners[0]({ ...store.getState(), count: 5 }, store.getState())).not.toThrow();
		cleanup();
		expect(unsub).toHaveBeenCalledOnce();
	});

	it('renders initial state inside a component', () => {
		const store = makeCounter();
		render(UseZustandHarness, { store, select: ((s: Counter) => s.count) as (s: unknown) => unknown });
		expect(screen.getByTestId('value')).toHaveTextContent('0');
	});

	it('re-renders when the store changes', () => {
		const store = makeCounter();
		render(UseZustandHarness, { store, select: ((s: Counter) => s.count) as (s: unknown) => unknown });
		store.getState().inc();
		flushSync();
		expect(screen.getByTestId('value')).toHaveTextContent('1');
		store.getState().inc();
		store.getState().inc();
		flushSync();
		expect(screen.getByTestId('value')).toHaveTextContent('3');
	});

	it('updates the returned object in place', () => {
		const store = makeCounter();
		let state: Counter | undefined;
		const cleanup = $effect.root(() => {
			state = useZustand(store);
		});
		flushSync();
		const ref = state;
		store.getState().inc();
		expect(state).toBe(ref);
		expect(ref?.count).toBe(1);
		cleanup();
	});

	it('picks up changes made between init and mount', () => {
		const store = makeCounter();
		let state: Counter | undefined;
		const cleanup = $effect.root(() => {
			state = useZustand(store);
			store.setState({ count: 7 });
		});
		flushSync();
		expect(state?.count).toBe(7);
		cleanup();
	});

	it('stops updating after unmount', () => {
		const store = makeCounter();
		const { unmount } = render(UseZustandHarness, {
			store,
			select: ((s: Counter) => s.count) as (s: unknown) => unknown
		});
		unmount();
		expect(() => store.getState().inc()).not.toThrow();
		expect(store.getState().count).toBe(1);
	});
});
