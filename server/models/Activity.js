const { Schema, model } = require('mongoose');

// Append-only log of CSR notes and automatic change records for each customer
const activitySchema = new Schema(
	{
		customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
		type: { type: String, enum: ['note', 'change'], required: true },
		message: { type: String, required: true, trim: true },
		author: { type: String, default: 'CSR' },
	},
	{ timestamps: true },
);

activitySchema.index({ customer: 1, createdAt: -1 });

module.exports = model('Activity', activitySchema);
