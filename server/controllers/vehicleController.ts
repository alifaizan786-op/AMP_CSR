import { Request, Response } from 'express';
import { VehicleDocument } from '../models';
import addMonths from '../utils/addMonths';
import assertVersion from '../utils/assertVersion';
import findCustomer from '../utils/findCustomer';
import findVehicle from '../utils/findVehicle';
import formatMoney from '../utils/formatMoney';
import HttpError from '../utils/HttpError';
import logActivity from '../utils/logActivity';
import PLANS, { isPlanKey } from '../utils/plans';
import readReason from '../utils/readReason';
import {
	chargeMembership,
	describeVehicle,
	endSubscription,
	hasLiveSubscription,
	planName,
	pushVehicle,
	readVehicleInput,
	startSubscription,
} from '../utils/vehicleHelpers';

type VehicleParams = { id: string; vehicleId: string };

// POST /api/customers/:id/vehicles
export const addVehicle = async (
	req: Request<{ id: string }>,
	res: Response,
) => {
	const input = readVehicleInput(req.body);
	const plan = req.body.plan;
	if (plan !== undefined && !isPlanKey(plan)) {
		throw new HttpError(
			400,
			`Plan must be one of: ${Object.keys(PLANS).join(', ')}`,
		);
	}

	const customer = await findCustomer(req.params.id);
	const vehicle = pushVehicle(customer, input);
	if (plan) startSubscription(vehicle, plan);

	await customer.save();

	if (plan) {
		await chargeMembership(
			customer,
			vehicle,
			`${planName(plan)} monthly membership`,
		);
		await logActivity(
			customer._id,
			`Added vehicle ${describeVehicle(vehicle)} with ${planName(plan)} membership`,
		);
	} else {
		await logActivity(
			customer._id,
			`Added vehicle ${describeVehicle(vehicle)}`,
		);
	}

	res.status(201).json(customer);
};

// The vehicle details a CSR can correct, with the labels used in the activity log
const VEHICLE_FIELDS = [
	['plate', 'Plate'],
	['year', 'Year'],
	['make', 'Make'],
	['model', 'Model'],
	['color', 'Color'],
] as const;

// PATCH /api/customers/:id/vehicles/:vehicleId
// Corrects a car's details, e.g. a mistyped plate that stops the car being recognized at the wash.
// The client sends the full set of details; an optional field left out is cleared.
export const updateVehicle = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const input = readVehicleInput(req.body);
	const customer = await findCustomer(req.params.id);
	assertVersion(customer, req.body.expectedVersion);
	const vehicle = findVehicle(customer, req.params.vehicleId);

	const changes: string[] = [];
	for (let i = 0; i < VEHICLE_FIELDS.length; i++) {
		const [field, label] = VEHICLE_FIELDS[i];
		// Compare after setting, so the schema's plate normalization and trimming apply first
		const before = vehicle[field];
		vehicle.set(field, input[field]);
		if (vehicle[field] !== before) {
			changes.push(
				`${label} changed from "${before ?? ''}" to "${vehicle[field] ?? ''}"`,
			);
		}
	}

	if (!changes.length) return res.json(customer);

	// Same rule as adding a car: one plate appears once per account
	for (let i = 0; i < customer.vehicles.length; i++) {
		const other = customer.vehicles[i];
		if (!other._id.equals(vehicle._id) && other.plate === vehicle.plate) {
			throw new HttpError(409, `${vehicle.plate} is already on this account`);
		}
	}

	await customer.save();
	await logActivity(
		customer._id,
		`Updated vehicle ${vehicle.plate}: ${changes.join('; ')}`,
	);

	res.json(customer);
};

// DELETE /api/customers/:id/vehicles/:vehicleId
export const removeVehicle = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const customer = await findCustomer(req.params.id);
	const vehicle = findVehicle(customer, req.params.vehicleId);

	// Removing a vehicle with a live membership would silently drop it, so the CSR must decide first
	if (hasLiveSubscription(vehicle)) {
		throw new HttpError(
			409,
			'Cancel or transfer the membership before removing this vehicle',
		);
	}

	const description = describeVehicle(vehicle);
	vehicle.deleteOne();
	await customer.save();
	await logActivity(customer._id, `Removed vehicle ${description}`);

	res.json(customer);
};

// POST /api/customers/:id/vehicles/:vehicleId/subscription
export const addSubscription = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const plan = req.body?.plan;
	if (!isPlanKey(plan)) {
		throw new HttpError(
			400,
			`Plan must be one of: ${Object.keys(PLANS).join(', ')}`,
		);
	}

	const customer = await findCustomer(req.params.id);
	const vehicle = findVehicle(customer, req.params.vehicleId);

	if (hasLiveSubscription(vehicle)) {
		throw new HttpError(409, `${vehicle.plate} already has a membership`);
	}

	startSubscription(vehicle, plan);
	await customer.save();
	await chargeMembership(
		customer,
		vehicle,
		`${planName(plan)} monthly membership`,
	);
	await logActivity(
		customer._id,
		`Started ${planName(plan)} membership on ${describeVehicle(vehicle)}`,
	);

	res.status(201).json(customer);
};

// PATCH /api/customers/:id/vehicles/:vehicleId/subscription
export const changePlan = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const plan = req.body?.plan;
	if (!isPlanKey(plan)) {
		throw new HttpError(
			400,
			`Plan must be one of: ${Object.keys(PLANS).join(', ')}`,
		);
	}

	const customer = await findCustomer(req.params.id);
	assertVersion(customer, req.body.expectedVersion);
	const vehicle = findVehicle(customer, req.params.vehicleId);
	const subscription = vehicle.subscription;

	if (!subscription || subscription.status === 'cancelled') {
		throw new HttpError(409, `${vehicle.plate} has no active membership`);
	}
	if (subscription.status === 'overdue') {
		throw new HttpError(
			409,
			'Resolve the overdue payment before changing plans',
		);
	}
	if (subscription.plan === plan) {
		return res.json(customer);
	}

	const previous = `${planName(subscription.plan)} (${formatMoney(subscription.price)}/mo)`;
	// The new price applies from the next billing date; no proration
	subscription.plan = plan;
	subscription.price = PLANS[plan].price;

	await customer.save();
	await logActivity(
		customer._id,
		`Changed membership on ${vehicle.plate} from ${previous} to ${planName(plan)} (${formatMoney(subscription.price)}/mo)`,
	);

	res.json(customer);
};

// POST /api/customers/:id/vehicles/:vehicleId/subscription/cancel
export const cancelSubscription = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const reason = readReason(req.body, 'A cancellation reason is required');

	const customer = await findCustomer(req.params.id);
	const vehicle = findVehicle(customer, req.params.vehicleId);
	const subscription = vehicle.subscription;

	if (!subscription || subscription.status === 'cancelled') {
		throw new HttpError(
			409,
			`${vehicle.plate} has no active membership to cancel`,
		);
	}

	// Cancels immediately; billing stops and no further charges are made
	endSubscription(vehicle, reason);

	await customer.save();
	await logActivity(
		customer._id,
		`Cancelled ${planName(subscription.plan)} membership on ${vehicle.plate}. Reason: ${reason}`,
	);

	res.json(customer);
};

// POST /api/customers/:id/vehicles/:vehicleId/subscription/transfer
export const transferSubscription = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const body = req.body ?? {};
	const hasTarget = typeof body.toVehicleId === 'string';
	const hasNewVehicle = body.vehicle !== undefined;

	if (hasTarget === hasNewVehicle) {
		throw new HttpError(
			400,
			'Send either toVehicleId (an existing vehicle) or vehicle (a new one), not both',
		);
	}

	const customer = await findCustomer(req.params.id);
	const source = findVehicle(customer, req.params.vehicleId);
	const subscription = source.subscription;

	if (!subscription || subscription.status === 'cancelled') {
		throw new HttpError(
			409,
			`${source.plate} has no active membership to transfer`,
		);
	}

	let target: VehicleDocument;
	if (hasTarget) {
		target = findVehicle(customer, body.toVehicleId);
		if (target._id.equals(source._id)) {
			throw new HttpError(400, 'Choose a different vehicle to transfer to');
		}
		if (hasLiveSubscription(target)) {
			throw new HttpError(409, `${target.plate} already has a membership`);
		}
	} else {
		target = pushVehicle(customer, readVehicleInput(body.vehicle));
	}

	// The membership moves as-is: same plan, price, start date, and billing status
	target.subscription = {
		plan: subscription.plan,
		price: subscription.price,
		status: subscription.status,
		startDate: subscription.startDate,
		nextBillingDate: subscription.nextBillingDate,
	};
	source.subscription = undefined;

	const removeOld = body.removeOldVehicle === true;
	const sourceDescription = describeVehicle(source);
	if (removeOld) source.deleteOne();

	await customer.save();
	await logActivity(
		customer._id,
		`Transferred ${planName(target.subscription!.plan)} membership from ${sourceDescription} to ${describeVehicle(target)}` +
			(removeOld ? `, and removed ${source.plate}` : ''),
	);

	res.json(customer);
};

// POST /api/customers/:id/vehicles/:vehicleId/subscription/retry-payment
export const retryPayment = async (
	req: Request<VehicleParams>,
	res: Response,
) => {
	const customer = await findCustomer(req.params.id);
	const vehicle = findVehicle(customer, req.params.vehicleId);
	const subscription = vehicle.subscription;

	if (!subscription || subscription.status !== 'overdue') {
		throw new HttpError(409, `${vehicle.plate} has no overdue payment`);
	}

	// The failed charge stays in history; a new successful charge is added alongside it
	subscription.status = 'active';
	subscription.nextBillingDate = addMonths(new Date(), 1);

	await customer.save();
	await chargeMembership(
		customer,
		vehicle,
		`${planName(subscription.plan)} monthly membership (payment retry)`,
	);
	await logActivity(
		customer._id,
		`Retried payment on ${vehicle.plate}: ${formatMoney(subscription.price)} charged successfully`,
	);

	res.json(customer);
};
