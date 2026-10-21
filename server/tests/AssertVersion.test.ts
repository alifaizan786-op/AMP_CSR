import { describe, expect, it } from 'vitest';
import { CustomerDocument } from '../models';
import assertVersion from '../utils/assertVersion';
import HttpError from '../utils/HttpError';

// Only __v is read, so a plain object stands in for the loaded customer
const customerAt = (version: number) =>
	({ __v: version }) as unknown as CustomerDocument;

// Runs the check and returns the HttpError it threw, or undefined if it passed
const errorFor = (version: number, expected: unknown) => {
	try {
		assertVersion(customerAt(version), expected);
	} catch (err) {
		return err as HttpError;
	}
	return undefined;
};

describe('assertVersion', () => {
	it('passes when the client saw the current version', () => {
		expect(errorFor(7, 7)).toBeUndefined();
	});

	// The lost-update case: a tab loaded at version 5 tries to save after a change made it 7
	it('rejects a write from an out-of-date page with a 409', () => {
		const error = errorFor(7, 5);
		expect(error?.status).toBe(409);
		expect(error?.message).toMatch(/changed by someone else/);
	});

	it('requires the version, as a whole number', () => {
		for (const expected of [undefined, '7', 7.5, null]) {
			expect(errorFor(7, expected)?.status).toBe(400);
		}
	});
});
