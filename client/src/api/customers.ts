import type {
	AccountFields,
	Activity,
	Customer,
	CustomerDetailResponse,
	CustomerListResponse,
	CustomerStatus,
} from '../types';
import { request } from './client';

interface CustomerListParams {
	search?: string;
	status?: CustomerStatus;
	page?: number;
	limit?: number;
}

export const getCustomers = (
	params: CustomerListParams,
	signal?: AbortSignal,
) => {
	// URLSearchParams handles encoding, e.g. "(404) 555" becomes "%28404%29+555"
	const query = new URLSearchParams();
	if (params.search) query.set('search', params.search);
	if (params.status) query.set('status', params.status);
	if (params.page) query.set('page', String(params.page));
	if (params.limit) query.set('limit', String(params.limit));

	return request<CustomerListResponse>(`/customers?${query}`, { signal });
};

export const getCustomer = (id: string, signal?: AbortSignal) =>
	request<CustomerDetailResponse>(`/customers/${id}`, { signal });

// PATCH sends only the fields that changed; the server returns the updated customer
export const updateCustomer = (id: string, fields: Partial<AccountFields>) =>
	request<Customer>(`/customers/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(fields),
	});

// Returns the new activity entry, not the customer
export const addNote = (customerId: string, message: string) =>
	request<Activity>(`/customers/${customerId}/notes`, {
		method: 'POST',
		body: JSON.stringify({ message }),
	});

// Cancels every active and overdue membership in one request; the account and its history stay
export const cancelAccount = (id: string, reason: string) =>
	request<Customer>(`/customers/${id}/cancel`, {
		method: 'POST',
		body: JSON.stringify({ reason }),
	});
