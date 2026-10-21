import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Purchase } from '../models';
import findCustomer from '../utils/findCustomer';
import formatMoney from '../utils/formatMoney';
import HttpError from '../utils/HttpError';
import logActivity from '../utils/logActivity';
import readReason from '../utils/readReason';

type PurchaseParams = { id: string; purchaseId: string };

// POST /api/customers/:id/purchases/:purchaseId/refund
// Full refund of a paid charge. It doesn't change any membership; cancelling is a separate action.
export const refundPurchase = async (
	req: Request<PurchaseParams>,
	res: Response,
) => {
	const reason = readReason(req.body, 'A refund reason is required');
	const customer = await findCustomer(req.params.id);
	if (!isValidObjectId(req.params.purchaseId)) {
		throw new HttpError(400, 'Invalid purchase id');
	}

	// One atomic update that only matches a purchase that is still paid, so two refund clicks
	// can't both succeed: the second finds nothing to update
	const purchase = await Purchase.findOneAndUpdate(
		{ _id: req.params.purchaseId, customer: customer._id, status: 'paid' },
		{ status: 'refunded', refundReason: reason, refundedAt: new Date() },
		{ returnDocument: 'after' },
	);

	if (!purchase) {
		// Nothing matched: say why, so the CSR knows what to tell the customer
		const existing = await Purchase.findOne({
			_id: req.params.purchaseId,
			customer: customer._id,
		});
		if (!existing)
			throw new HttpError(404, 'Purchase not found on this account');
		throw new HttpError(
			409,
			existing.status === 'failed'
				? 'This charge failed, so there is nothing to refund'
				: 'This purchase was already refunded',
		);
	}

	const what =
		purchase.description ??
		(purchase.type === 'single_wash' ? 'Single wash' : 'Membership');
	const plate = purchase.vehiclePlate ? ` on ${purchase.vehiclePlate}` : '';
	await logActivity(
		customer._id,
		`Refunded ${formatMoney(purchase.amount)} for ${what}${plate}. Reason: ${reason}`,
	);

	res.json(purchase);
};
