import { QueryFilter } from 'mongoose';
import { CustomerData } from '../models';
import escapeRegex from './escapeRegex';

export type CustomerStatus = CustomerData['status'];

export const STATUSES: CustomerStatus[] = ['active', 'overdue', 'inactive'];

// Narrows a query string to a valid status,
// so TypeScript knows it's safe to filter by
export const isCustomerStatus = (value: string): value is CustomerStatus =>
	(STATUSES as string[]).includes(value);

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

	// Phones are stored as digits only, so compare digits only.
	// Skipped when the search has no digits,
	// since an empty pattern would match every customer.
	const digits = text.replace(/\D/g, '');
	if (digits) conditions.push({ phone: new RegExp(digits) });

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
