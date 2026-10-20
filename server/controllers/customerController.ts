import { Request, Response } from 'express';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Activity, Customer, CustomerData, Purchase } from '../models';
import {
	buildSearchFilter,
	isCustomerStatus,
	STATUSES,
} from '../utils/customerQuery';
import findCustomer from '../utils/findCustomer';
import HttpError from '../utils/HttpError';
import logActivity from '../utils/logActivity';
import parsePositiveInt from '../utils/parsePositiveInt';
import readCancelReason from '../utils/readCancelReason';
import {
	endSubscription,
	hasLiveSubscription,
	planName,
} from '../utils/vehicleHelpers';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_NOTE_LENGTH = 1000;

// Only these fields can be edited through the API; status and vehicles have their own routes
const EDITABLE_FIELDS = ['firstName', 'lastName', 'email', 'phone'] as const;
const FIELD_LABELS: Record<(typeof EDITABLE_FIELDS)[number], string> = {
	firstName: 'First name',
	lastName: 'Last name',
	email: 'Email',
	phone: 'Phone',
};

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
		throw new HttpError(400, `Status must be one of: ${STATUSES.join(', ')}`);
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
		throw new HttpError(400, 'Invalid customer id');
	}

	const [customer, purchases, activities] = await Promise.all([
		Customer.findById(id),
		Purchase.find({ customer: id }).sort({ createdAt: -1 }).lean(),
		Activity.find({ customer: id }).sort({ createdAt: -1 }).lean(),
	]);

	if (!customer) {
		throw new HttpError(404, 'Customer not found');
	}

	res.json({ customer, purchases, activities });
};

// PATCH /api/customers/:id
export const updateCustomer = async (
	req: Request<{ id: string }>,
	res: Response,
) => {
	const customer = await findCustomer(req.params.id);
	// Express 5 leaves req.body undefined when a request has no body
	const body = req.body ?? {};
	const changes: string[] = [];

	for (let i = 0; i < EDITABLE_FIELDS.length; i++) {
		const field = EDITABLE_FIELDS[i];
		const value = body[field];
		if (value === undefined) continue;

		if (typeof value !== 'string') {
			throw new HttpError(400, `${FIELD_LABELS[field]} must be text`);
		}

		// Compare after setting, so the schema's trim, lowercase, and digits-only rules apply first
		const before = customer[field];
		customer[field] = value;
		if (customer[field] !== before) {
			changes.push(
				`${FIELD_LABELS[field]} changed from "${before}" to "${customer[field]}"`,
			);
		}
	}

	if (changes.length) {
		await customer.save();
		await logActivity(customer._id, changes.join('; '));
	}

	res.json(customer);
};

// POST /api/customers/:id/notes
export const addNote = async (req: Request<{ id: string }>, res: Response) => {
	const message =
		typeof req.body?.message === 'string' ? req.body.message.trim() : '';

	if (!message) throw new HttpError(400, 'Note cannot be empty');
	if (message.length > MAX_NOTE_LENGTH) {
		throw new HttpError(
			400,
			`Note must be ${MAX_NOTE_LENGTH} characters or less`,
		);
	}

	const customer = await findCustomer(req.params.id);
	const note = await logActivity(customer._id, message, 'note');

	res.status(201).json(note);
};

// POST /api/customers/:id/cancel
// "Cancel my account": ends every live membership in one save, so it can't half-succeed.
// The account, vehicles, and history stay, so the customer can rejoin later.
export const cancelAccount = async (
	req: Request<{ id: string }>,
	res: Response,
) => {
	const reason = readCancelReason(req.body);
	const customer = await findCustomer(req.params.id);

	const cancelled: string[] = [];
	const now = new Date();
	for (let i = 0; i < customer.vehicles.length; i++) {
		const vehicle = customer.vehicles[i];
		if (!hasLiveSubscription(vehicle)) continue;

		endSubscription(vehicle, reason, now);
		cancelled.push(
			`${planName(vehicle.subscription!.plan)} on ${vehicle.plate}`,
		);
	}

	if (!cancelled.length) {
		throw new HttpError(
			409,
			'This account has no active memberships to cancel',
		);
	}

	await customer.save();
	await logActivity(
		customer._id,
		`Cancelled account: ${cancelled.join(', ')}. Reason: ${reason}`,
	);

	res.json(customer);
};
