import { InferSchemaType, Schema, model } from 'mongoose';
import PLANS from '../utils/plans';

const subscriptionSchema = new Schema(
	{
		plan: { type: String, enum: Object.keys(PLANS), required: true },
		// Locked in at signup so future plan price changes don't affect existing members
		price: { type: Number, required: true },
		status: {
			type: String,
			enum: ['active', 'overdue', 'cancelled'],
			default: 'active',
		},
		startDate: { type: Date, default: Date.now },
		nextBillingDate: Date,
		cancelledAt: Date,
		cancelReason: String,
	},
	{ _id: false },
);

const vehicleSchema = new Schema({
	plate: {
		type: String,
		required: true,
		// Store without spaces or dashes so "abc 123" and "ABC-123" are the same plate
		set: (value: string) => value.replace(/[\s-]/g, '').toUpperCase(),
		match: [/^[A-Z0-9]{2,8}$/, 'Plate must be 2 to 8 letters or numbers'],
	},
	make: { type: String, trim: true },
	model: { type: String, trim: true },
	year: {
		type: Number,
		min: [1980, 'Year must be 1980 or later'],
		max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
	},
	color: { type: String, trim: true },
	subscription: { type: subscriptionSchema, default: undefined },
});

const customerSchema = new Schema(
	{
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				'Please enter a valid email address',
			],
		},
		phone: {
			type: String,
			required: true,
			// Store digits only so "(404) 555-1234" and "404-555-1234" match the same customer in search
			set: (value: string) => value.replace(/\D/g, ''),
			// 10 to 15 digits covers US and UK numbers (AMP operates in both)
			match: [/^\d{10,15}$/, 'Please enter a valid phone number'],
		},
		status: {
			type: String,
			enum: ['active', 'overdue', 'inactive'],
			default: 'inactive',
		},
		vehicles: [vehicleSchema],
	},
	{ timestamps: true, toJSON: { virtuals: true } },
);

// Indexes on the fields CSRs search and filter by
customerSchema.index({ phone: 1 });
customerSchema.index({ 'vehicles.plate': 1 });
customerSchema.index({ status: 1 });

customerSchema.virtual('fullName').get(function () {
	return `${this.firstName} ${this.lastName}`;
});

// Status is derived from subscriptions so it can never drift out of sync.
// Overdue wins, since it's the status a CSR most needs to see.
customerSchema.pre('save', function () {
	const statuses: string[] = [];
	for (let i = 0; i < this.vehicles.length; i++) {
		const subscription = this.vehicles[i].subscription;
		if (subscription) statuses.push(subscription.status);
	}

	if (statuses.includes('overdue')) this.status = 'overdue';
	else if (statuses.includes('active')) this.status = 'active';
	else this.status = 'inactive';
});

export type CustomerData = InferSchemaType<typeof customerSchema>;

const Customer = model('Customer', customerSchema);

export type CustomerDocument = InstanceType<typeof Customer>;
export type VehicleDocument = CustomerDocument['vehicles'][number];

export default Customer;
