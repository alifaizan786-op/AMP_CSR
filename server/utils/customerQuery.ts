import { QueryFilter } from 'mongoose';
import { CustomerData } from '../models';
import escapeRegex from './escapeRegex';

export type CustomerStatus = CustomerData['status'];

export const STATUSES: CustomerStatus[] = ['active', 'overdue', 'inactive'];

// Narrows a query string to a valid status,
// so TypeScript knows it's safe to filter by
export const isCustomerStatus = (value: string): value is CustomerStatus =>
	(STATUSES as string[]).includes(value);

// Only digits and the characters people type in phone numbers: (404) 555-0101, +1 404.555.0101
const PHONE_LIKE = /^[\d\s()+.-]+$/;

// One search box matches name, email, phone, or plate,
// since callers lead with different details
export const buildSearchFilter = (
	search: string,
): QueryFilter<CustomerData> => {
	const text = search.trim();
	if (!text) return {};

	const pattern = new RegExp(escapeRegex(text), 'i');
	const conditions: QueryFilter<CustomerData>[] = [
		{ email: pattern },
		{
			'vehicles.plate': new RegExp(
				escapeRegex(text.replace(/[\s-]/g, '')),
				'i',
			),
		},
	];

	// Phones are stored as digits only, so compare digits only, but only when the search
	// looks like a phone number (digits plus formatting). Otherwise "x 1" or "miles 404"
	// would be stripped to "1" or "404" and match unrelated customers.
	// At least 3 digits, so a single typed digit doesn't match most of the list.
	let digits = text.replace(/\D/g, '');
	// US numbers are stored as 10 digits, so drop a leading country code ("+1 404...")
	if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
	if (PHONE_LIKE.test(text) && digits.length >= 3) {
		conditions.push({ phone: new RegExp(digits) });
	}

	// Every word must match a first or last name, so "Jordan Miles", "Miles Jordan",
	// and three-word names like "Mary Ann Smith" all work
	const words = text.split(/\s+/);
	const nameConditions: QueryFilter<CustomerData>[] = [];
	for (let i = 0; i < words.length; i++) {
		const wordPattern = new RegExp(escapeRegex(words[i]), 'i');
		nameConditions.push({
			$or: [{ firstName: wordPattern }, { lastName: wordPattern }],
		});
	}
	conditions.push({ $and: nameConditions });

	return { $or: conditions };
};
