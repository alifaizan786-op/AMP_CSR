import { isValidObjectId } from 'mongoose';
import { CustomerDocument } from '../models';
import HttpError from './HttpError';

// Finds a vehicle on a customer's account, with the same 400/404 rules as findCustomer
const findVehicle = (customer: CustomerDocument, vehicleId: string) => {
	if (!isValidObjectId(vehicleId))
		throw new HttpError(400, 'Invalid vehicle id');

	const vehicle = customer.vehicles.id(vehicleId);
	if (!vehicle) throw new HttpError(404, 'Vehicle not found on this account');

	return vehicle;
};

export default findVehicle;
