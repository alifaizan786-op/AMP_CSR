import { describe, expect, it } from 'vitest';
import isCardExpired from '../utils/cardExpiry';

// Noon UTC, so the result is the same in every time zone the tests run in
const utc = (day: string) => new Date(`${day}T12:00:00Z`);

describe('isCardExpired', () => {
	it('is valid through the last day of the expiry month', () => {
		expect(
			isCardExpired({ expMonth: 10, expYear: 2026 }, utc('2026-10-31')),
		).toBe(false);
	});

	it('is expired from the first day of the next month', () => {
		expect(
			isCardExpired({ expMonth: 10, expYear: 2026 }, utc('2026-11-01')),
		).toBe(true);
	});

	it('handles a December expiry across the year boundary', () => {
		expect(
			isCardExpired({ expMonth: 12, expYear: 2026 }, utc('2026-12-31')),
		).toBe(false);
		expect(
			isCardExpired({ expMonth: 12, expYear: 2026 }, utc('2027-01-01')),
		).toBe(true);
	});

	it('treats an earlier year as expired even with a later month', () => {
		expect(
			isCardExpired({ expMonth: 12, expYear: 2025 }, utc('2026-01-15')),
		).toBe(true);
	});
});
