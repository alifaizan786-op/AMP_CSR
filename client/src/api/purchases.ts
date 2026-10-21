import type { Purchase } from '../types';
import { request } from './client';

// Purchase routes, nested under a customer like the server's routes/purchases.ts

// Full refund of a paid charge; returns the updated purchase
export const refundPurchase = (
	customerId: string,
	purchaseId: string,
	reason: string,
) =>
	request<Purchase>(`/customers/${customerId}/purchases/${purchaseId}/refund`, {
		method: 'POST',
		body: JSON.stringify({ reason }),
	});
