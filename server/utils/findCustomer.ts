import { isValidObjectId } from 'mongoose';
import { Customer } from '../models';
import HttpError from './HttpError';

// Loads a customer for routes that change it,
// so each route doesn't repeat the same checks
const findCustomer = async (id: string) => {
	if (!isValidObjectId(id)) throw new HttpError(400, 'Invalid customer id');

	const customer = await Customer.findById(id);
	if (!customer) throw new HttpError(404, 'Customer not found');

	return customer;
};

export default findCustomer;
