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
