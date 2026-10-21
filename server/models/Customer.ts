import { InferSchemaType, Schema, model } from 'mongoose';
import deriveCustomerStatus from '../utils/customerStatus';
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
		required: [true, 'Plate is required'],
		// Store without spaces or dashes so "abc 123" and "ABC-123" are the same plate
		set: (value: string) => value.replace(/[\s-]/g, '').toUpperCase(),
		match: [/^[A-Z0-9]{2,8}$/, 'Plate must be 2 to 8 letters or numbers'],
	},
	make: {
		type: String,
		trim: true,
		maxlength: [30, 'Make can be at most 30 characters'],
	},
	model: {
		type: String,
		trim: true,
		maxlength: [30, 'Model can be at most 30 characters'],
	},
	year: {
		type: Number,
		min: [1980, 'Year must be 1980 or later'],
		max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
	},
	color: {
		type: String,
		trim: true,
		maxlength: [30, 'Color can be at most 30 characters'],
	},
	subscription: { type: subscriptionSchema, default: undefined },
});

const customerSchema = new Schema(
	{
		// Length limits keep one bad paste from flooding the page and the activity log
		firstName: {
			type: String,
			required: [true, 'First name is required'],
			trim: true,
			maxlength: [50, 'First name can be at most 50 characters'],
		},
		lastName: {
			type: String,
			required: [true, 'Last name is required'],
			trim: true,
			maxlength: [50, 'Last name can be at most 50 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			// 254 is the longest a valid email address can be
			maxlength: [254, 'Email can be at most 254 characters'],
			match: [
				/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				'Please enter a valid email address',
			],
		},
		phone: {
			type: String,
			required: [true, 'Phone is required'],
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
	// optimisticConcurrency: save() fails if someone else saved this customer since it was loaded,
	// so two simultaneous requests (e.g. a double "retry payment") can't both go through
	{ timestamps: true, optimisticConcurrency: true },
);

// Indexes on the fields CSRs search and filter by
customerSchema.index({ phone: 1 });
customerSchema.index({ 'vehicles.plate': 1 });
customerSchema.index({ status: 1 });

// Recalculated on every save; the rule lives in a plain function so it can be unit tested
customerSchema.pre('save', function () {
	this.status = deriveCustomerStatus(this.vehicles);
});

export type CustomerData = InferSchemaType<typeof customerSchema>;

const Customer = model('Customer', customerSchema);

export type CustomerDocument = InstanceType<typeof Customer>;
export type VehicleDocument = CustomerDocument['vehicles'][number];

export default Customer;
