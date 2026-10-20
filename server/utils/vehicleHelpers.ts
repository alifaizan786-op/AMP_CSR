import { CustomerDocument, Purchase, VehicleDocument } from '../models';
import addMonths from './addMonths';
import HttpError from './HttpError';
import PLANS, { PlanKey } from './plans';

export interface VehicleInput {
	plate: string;
	make?: string;
	model?: string;
	year?: number;
	color?: string;
}

// Active and overdue memberships are still live; only cancelled ones are finished
export const hasLiveSubscription = (vehicle: VehicleDocument): boolean =>
	!!vehicle.subscription && vehicle.subscription.status !== 'cancelled';

export const describeVehicle = (vehicle: VehicleDocument): string => {
	const details = [vehicle.year, vehicle.make, vehicle.model]
		.filter(Boolean)
		.join(' ');
	return details ? `${vehicle.plate} (${details})` : vehicle.plate;
};

export const planName = (plan: string): string => PLANS[plan as PlanKey].name;

// Validates vehicle fields from a request body; the schema handles plate format and year range
export const readVehicleInput = (
	body: Record<string, unknown> | undefined,
): VehicleInput => {
	if (!body || typeof body.plate !== 'string' || !body.plate.trim()) {
		throw new HttpError(400, 'Plate is required');
	}

	const textFields = ['make', 'model', 'color'] as const;
	for (let i = 0; i < textFields.length; i++) {
		const value = body[textFields[i]];
		if (value !== undefined && typeof value !== 'string') {
			throw new HttpError(400, `${textFields[i]} must be text`);
		}
	}
	if (body.year !== undefined && !Number.isInteger(body.year)) {
		throw new HttpError(400, 'Year must be a whole number');
	}

	return {
		plate: body.plate,
		make: body.make as string | undefined,
		model: body.model as string | undefined,
		year: body.year as number | undefined,
		color: body.color as string | undefined,
	};
};

// Adds a vehicle and returns it, rejecting a plate that's already on this account
export const pushVehicle = (
	customer: CustomerDocument,
	input: VehicleInput,
): VehicleDocument => {
	customer.vehicles.push(input);
	const vehicle = customer.vehicles[customer.vehicles.length - 1];

	// Checked after push, so the plate has already been normalized by the schema setter
	for (let i = 0; i < customer.vehicles.length - 1; i++) {
		if (customer.vehicles[i].plate === vehicle.plate) {
			throw new HttpError(409, `${vehicle.plate} is already on this account`);
		}
	}
	return vehicle;
};

export const startSubscription = (vehicle: VehicleDocument, plan: PlanKey) => {
	const now = new Date();
	vehicle.subscription = {
		plan,
		price: PLANS[plan].price,
		status: 'active',
		startDate: now,
		nextBillingDate: addMonths(now, 1),
	};
};

// Billing is simulated: every charge succeeds and is recorded in purchase history
export const chargeMembership = (
	customer: CustomerDocument,
	vehicle: VehicleDocument,
	description: string,
) => {
	const subscription = vehicle.subscription!;
	return Purchase.create({
		customer: customer._id,
		vehicleId: vehicle._id,
		vehiclePlate: vehicle.plate,
		type: 'membership',
		description,
		amount: subscription.price,
		status: 'paid',
	});
};

// Cancels immediately: billing stops and no further charges are made.
// Shared by single-membership and whole-account cancellation, so both change the same fields.
export const endSubscription = (
	vehicle: VehicleDocument,
	reason: string,
	now = new Date(),
) => {
	const subscription = vehicle.subscription!;
	subscription.status = 'cancelled';
	subscription.cancelledAt = now;
	subscription.cancelReason = reason;
	subscription.nextBillingDate = undefined;
};
