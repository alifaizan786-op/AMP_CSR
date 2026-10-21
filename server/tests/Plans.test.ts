import { describe, expect, it } from 'vitest';
import { isPlanKey } from '../utils/plans';

describe('isPlanKey', () => {
	it('accepts every real plan', () => {
		expect(isPlanKey('basic')).toBe(true);
		expect(isPlanKey('deluxe')).toBe(true);
		expect(isPlanKey('ultimate')).toBe(true);
	});

	// The bug this guards against: `in` also matched keys inherited from Object.prototype
	it('rejects inherited object keys', () => {
		expect(isPlanKey('toString')).toBe(false);
		expect(isPlanKey('constructor')).toBe(false);
		expect(isPlanKey('__proto__')).toBe(false);
	});

	it('rejects unknown plans and non-strings', () => {
		expect(isPlanKey('platinum')).toBe(false);
		expect(isPlanKey('Basic')).toBe(false);
		expect(isPlanKey(undefined)).toBe(false);
		expect(isPlanKey(1)).toBe(false);
	});
});
