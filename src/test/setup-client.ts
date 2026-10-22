import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { resetPage } from './mocks/app-state.svelte.ts';
import { resetForms } from './mocks/app-forms.ts';
import { resetNavigation } from './mocks/app-navigation.ts';

// jsdom lacks these browser APIs used by components.
if (!window.matchMedia) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
}

class MockIntersectionObserver {
	callback: IntersectionObserverCallback;
	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
	}
	observe = vi.fn((target: Element) => {
		this.callback(
			[{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
			this as unknown as IntersectionObserver
		);
	});
	unobserve = vi.fn();
	disconnect = vi.fn();
	takeRecords = vi.fn(() => []);
	root = null;
	rootMargin = '';
	thresholds = [];
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();
if (!HTMLElement.prototype.animate) {
	HTMLElement.prototype.animate = vi.fn(() => {
		const anim = { finished: Promise.resolve(), cancel: vi.fn(), onfinish: null as null | (() => void) };
		queueMicrotask(() => anim.onfinish?.());
		return anim;
	}) as unknown as HTMLElement['animate'];
}

afterEach(() => {
	resetPage();
	resetForms();
	resetNavigation();
	localStorage.clear();
});
