import { describe, expect, it } from 'vitest';
import HttpError from '../utils/HttpError';
import readReason from '../utils/readReason';

const MISSING = 'A cancellation reason is required';

// Runs the function and returns the HttpError it threw, so tests can check status and message
const errorFor = (body: Record<string, unknown> | undefined) => {
	try {
		readReason(body, MISSING);
	} catch (err) {
		return err as HttpError;
	}
	throw new Error('Expected readReason to throw');
};

describe('readReason', () => {
	it('returns the reason, trimmed', () => {
		expect(readReason({ reason: '  Moving away  ' }, MISSING)).toBe(
			'Moving away',
		);
	});

	it('accepts exactly 200 characters', () => {
		expect(readReason({ reason: 'a'.repeat(200) }, MISSING)).toHaveLength(200);
	});

	it('rejects a missing, empty, or whitespace-only reason with the given message', () => {
		for (const body of [undefined, {}, { reason: '' }, { reason: '   ' }]) {
			const error = errorFor(body);
			expect(error).toBeInstanceOf(HttpError);
			expect(error.status).toBe(400);
			expect(error.message).toBe(MISSING);
		}
	});

	it('rejects a reason that is not text', () => {
		expect(errorFor({ reason: 42 }).status).toBe(400);
		expect(errorFor({ reason: ['a'] }).status).toBe(400);
	});

	it('rejects more than 200 characters', () => {
		const error = errorFor({ reason: 'a'.repeat(201) });
		expect(error.status).toBe(400);
		expect(error.message).toBe('Reason must be 200 characters or less');
	});
});
