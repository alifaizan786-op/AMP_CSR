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

// Sends the full set of details (an optional field left out is cleared), plus the version the
// CSR loaded so a stale page can't overwrite a newer change (409)
export const updateVehicle = (
	customerId: string,
	vehicleId: string,
	vehicle: VehicleInput,
	expectedVersion: number,
) =>
	request<Customer>(`/customers/${customerId}/vehicles/${vehicleId}`, {
		method: 'PATCH',
		body: JSON.stringify({ ...vehicle, expectedVersion }),
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

// Cancels immediately: billing stops and no further charges are made.
// The server requires a reason (200 characters max) and keeps it on the membership.
export const cancelMembership = (
	customerId: string,
	vehicleId: string,
	reason: string,
) =>
	request<Customer>(
		`/customers/${customerId}/vehicles/${vehicleId}/subscription/cancel`,
		{ method: 'POST', body: JSON.stringify({ reason }) },
	);

// For a vehicle without a live membership; charges the first month right away
export const startMembership = (
	customerId: string,
	vehicleId: string,
	plan: PlanKey,
) =>
	request<Customer>(
		`/customers/${customerId}/vehicles/${vehicleId}/subscription`,
		{ method: 'POST', body: JSON.stringify({ plan }) },
	);

// No charge; the new price applies from the next billing date. Refused (409) while overdue,
// or if the account changed since the CSR loaded it (expectedVersion)
export const changePlan = (
	customerId: string,
	vehicleId: string,
	plan: PlanKey,
	expectedVersion: number,
) =>
	request<Customer>(
		`/customers/${customerId}/vehicles/${vehicleId}/subscription`,
		{ method: 'PATCH', body: JSON.stringify({ plan, expectedVersion }) },
	);
