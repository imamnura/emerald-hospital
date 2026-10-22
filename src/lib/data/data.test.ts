import { describe, expect, it } from 'vitest';
import * as help from '#lib/data/help-support.ts';
import * as landing from '#lib/data/landing.ts';
import * as libIndex from '#lib/index.ts';

describe('help-support data', () => {
	it('exposes contact options with unique actions', () => {
		expect(help.contactOptions.map((o) => o.action)).toEqual(['scroll-faqs', 'chat', 'call', 'email']);
		for (const o of help.contactOptions) {
			expect(o.title).toBeTruthy();
			expect(o.description).toBeTruthy();
		}
	});

	it('exposes FAQs, version and support contacts', () => {
		expect(help.popularFaqs.length).toBeGreaterThan(0);
		expect(help.APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
		expect(help.SUPPORT_PHONE).toMatch(/^\+\d+$/);
		expect(help.SUPPORT_EMAIL).toMatch(/^[^@]+@[^@]+\.[a-z]+$/);
	});
});

describe('landing data', () => {
	it('exports all landing sections', () => {
		expect(landing.LANDING_BRAND.name).toBeTruthy();
		expect(landing.LANDING_HERO.ctaLabel).toBeTruthy();
		expect(landing.LANDING_TRUST_BADGES.length).toBeGreaterThan(0);
		expect(landing.LANDING_FEATURES.items.length).toBeGreaterThan(0);
		expect(landing.LANDING_POPULAR_DOCTORS).toBeTypeOf('object');
		expect(landing.LANDING_TESTIMONIALS).toBeTypeOf('object');
		expect(landing.LANDING_FOOTER).toBeTypeOf('object');
	});

	it('hospital options start with "all" and have unique values', () => {
		const values = landing.LANDING_HOSPITALS.map((h) => h.value);
		expect(values[0]).toBe('all');
		expect(new Set(values).size).toBe(values.length);
	});

	it('feature ids are unique', () => {
		const ids = landing.LANDING_FEATURES.items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('lib index', () => {
	it('is an (empty) importable module', () => {
		expect(libIndex).toBeTypeOf('object');
	});
});
