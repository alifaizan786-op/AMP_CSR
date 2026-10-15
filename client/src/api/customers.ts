import type {
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
