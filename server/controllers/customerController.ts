import { Request, Response } from 'express';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Activity, Customer, Purchase } from '../models';
import { CustomerData } from '../models/Customer';
import { buildSearchFilter, isCustomerStatus, STATUSES } from '../utils/customerQuery';
import parsePositiveInt from '../utils/parsePositiveInt';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;



// GET /api/customers?search=&status=&page=&limit=
export const getCustomers = async (req: Request, res: Response) => {
	const search = typeof req.query.search === 'string' ? req.query.search : '';
	const statusParam =
		typeof req.query.status === 'string' ? req.query.status : '';
	const page = parsePositiveInt(req.query.page, 1);
	const limit = Math.min(
		parsePositiveInt(req.query.limit, DEFAULT_LIMIT),
		MAX_LIMIT,
	);

	if (statusParam && !isCustomerStatus(statusParam)) {
		return res
			.status(400)
			.json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
	}

	const searchFilter = buildSearchFilter(search);
	const filter: QueryFilter<CustomerData> = isCustomerStatus(statusParam)
		? { ...searchFilter, status: statusParam }
		: searchFilter;

	const [customers, total, statusGroups] = await Promise.all([
		Customer.find(filter)
			.select(
				'firstName lastName email phone status vehicles.plate vehicles.make vehicles.model',
			)
			.sort({ lastName: 1, firstName: 1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Customer.countDocuments(filter),
		// Counts per status for the current search (ignoring the status filter), for the filter tabs
		Customer.aggregate<{ _id: string; count: number }>([
			{ $match: searchFilter },
			{ $group: { _id: '$status', count: { $sum: 1 } } },
		]),
	]);

	const statusCounts: Record<string, number> = {
		active: 0,
		overdue: 0,
		inactive: 0,
	};
	for (let i = 0; i < statusGroups.length; i++) {
		statusCounts[statusGroups[i]._id] = statusGroups[i].count;
	}

	res.json({
		customers,
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
		statusCounts,
	});
};

// GET /api/customers/:id
export const getCustomerById = async (
	req: Request<{ id: string }>,
	res: Response,
) => {
	const { id } = req.params;

	// An invalid id would make Mongoose throw a CastError, so reject it up front with a clear 400
	if (!isValidObjectId(id)) {
		return res.status(400).json({ message: 'Invalid customer id' });
	}

	const [customer, purchases, activities] = await Promise.all([
		Customer.findById(id),
		Purchase.find({ customer: id }).sort({ createdAt: -1 }).lean(),
		Activity.find({ customer: id }).sort({ createdAt: -1 }).lean(),
	]);

	if (!customer) {
		return res.status(404).json({ message: 'Customer not found' });
	}

	res.json({ customer, purchases, activities });
};
