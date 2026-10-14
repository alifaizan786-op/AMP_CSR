const { Schema, model } = require('mongoose');

const purchaseSchema = new Schema(
	{
		customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
		vehicleId: Schema.Types.ObjectId,
		// Snapshot of the plate at purchase time, so receipts stay accurate after edits or transfers
		vehiclePlate: String,
		type: {
			type: String,
			enum: ['membership', 'single_wash'],
			required: true,
		},
		description: String,
		// In cents
		amount: { type: Number, required: true },
		status: {
			type: String,
			enum: ['paid', 'failed', 'refunded'],
			default: 'paid',
		},
		failureReason: String,
		refundReason: String,
	},
	{ timestamps: true },
);

// Purchase history is always loaded per customer, newest first
purchaseSchema.index({ customer: 1, createdAt: -1 });

module.exports = model('Purchase', purchaseSchema);
