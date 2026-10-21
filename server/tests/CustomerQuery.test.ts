import { describe, expect, it } from 'vitest';
import { buildSearchFilter } from '../utils/customerQuery';

// The search builds { $or: [...] }; these pull out the clauses the tests care about
const clauses = (search: string) =>
	(buildSearchFilter(search) as { $or: Record<string, unknown>[] }).$or;

const phoneClause = (search: string) =>
	clauses(search).find((clause) => 'phone' in clause)?.phone as
		| RegExp
		| undefined;

const plateClause = (search: string) =>
	clauses(search).find((clause) => 'vehicles.plate' in clause)?.[
		'vehicles.plate'
	] as RegExp;

describe('buildSearchFilter', () => {
	it('returns an empty filter for a blank search', () => {
		expect(buildSearchFilter('   ')).toEqual({});
	});

	it('matches phones by digits when the search looks like a phone number', () => {
		expect(phoneClause('(404) 555-0101')?.source).toBe('4045550101');
	});

	it('drops a leading US country code', () => {
		expect(phoneClause('+1 404 555 0101')?.source).toBe('4045550101');
	});

	// Otherwise "miles 404" would be reduced to "404" and match every 404 number
	it('skips the phone match when the search has letters', () => {
		expect(phoneClause('miles 404')).toBeUndefined();
	});

	it('skips the phone match for fewer than 3 digits', () => {
		expect(phoneClause('40')).toBeUndefined();
	});

	it('ignores spaces and dashes in plates', () => {
		expect(plateClause('ovr-1234').test('OVR1234')).toBe(true);
	});

	it('treats regex characters as plain text', () => {
		expect(plateClause('a.b').test('AXB')).toBe(false);
	});
});
