import { describe, expect, it } from 'vitest';
import addMonths from '../utils/addMonths';

// Noon UTC, so the expected date is the same in every time zone the tests run in
const utc = (day: string) => new Date(`${day}T12:00:00Z`);
const day = (date: Date) => date.toISOString().slice(0, 10);

describe('addMonths', () => {
	it('adds months on an ordinary day', () => {
		expect(day(addMonths(utc('2026-10-20'), 1))).toBe('2026-11-20');
	});

	it('rolls over into the next year', () => {
		expect(day(addMonths(utc('2026-12-15'), 1))).toBe('2027-01-15');
	});

	// The bug this guards against: Jan 31 + 1 month used to land on Mar 3
	it('clamps to the last day of a shorter month', () => {
		expect(day(addMonths(utc('2026-01-31'), 1))).toBe('2026-02-28');
		expect(day(addMonths(utc('2026-03-31'), 1))).toBe('2026-04-30');
	});

	it('uses Feb 29 in a leap year', () => {
		expect(day(addMonths(utc('2028-01-31'), 1))).toBe('2028-02-29');
	});

	it('goes backwards with a negative count', () => {
		expect(day(addMonths(utc('2026-03-31'), -1))).toBe('2026-02-28');
	});

	it('keeps the time of day', () => {
		expect(addMonths(utc('2026-01-31'), 1).toISOString()).toBe(
			'2026-02-28T12:00:00.000Z',
		);
	});

	it('does not change the date passed in', () => {
		const original = utc('2026-01-31');
		addMonths(original, 1);
		expect(day(original)).toBe('2026-01-31');
	});
});
