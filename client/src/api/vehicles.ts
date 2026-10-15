import type { Customer, PlanKey, VehicleInput } from '../types';
import { request } from './client';

// Vehicle and membership routes, nested under a customer like the server's routes/vehicles.ts.
// Every write returns the full updated customer.

// A plan starts a membership and charges the first month right away
export const addVehicle = (
	customerId: string,
	vehicle: VehicleInput,
	plan?: PlanKey,
) =>
	request<Customer>(`/customers/${customerId}/vehicles`, {
		method: 'POST',
		body: JSON.stringify({ ...vehicle, plan }),
	});

// The server refuses (409) while the vehicle has an active or overdue membership
export const removeVehicle = (customerId: string, vehicleId: string) =>
	request<Customer>(`/customers/${customerId}/vehicles/${vehicleId}`, {
		method: 'DELETE',
	});

// Either an existing vehicle on the account or a new one, never both (mirrors the server rule)
export type TransferTarget =
	| { toVehicleId: string }
	| { vehicle: VehicleInput };

// Moves the membership as-is (plan, price, billing date, status); no charge
export const transferMembership = (
	customerId: string,
	vehicleId: string,
	target: TransferTarget,
	removeOldVehicle: boolean,
) =>
	request<Customer>(
		`/customers/${customerId}/vehicles/${vehicleId}/subscription/transfer`,
		{
			method: 'POST',
			body: JSON.stringify({ ...target, removeOldVehicle }),
		},
	);

// Only allowed while overdue. Billing is simulated: it records a successful charge
// and sets the membership active with the next billing date a month out.
export const retryPayment = (customerId: string, vehicleId: string) =>
	request<Customer>(
		`/customers/${customerId}/vehicles/${vehicleId}/subscription/retry-payment`,
		{ method: 'POST' },
	);
