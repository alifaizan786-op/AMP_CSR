import { Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { retryPayment } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import type { Customer, Vehicle } from '../../types';
import { formatMoney } from '../../utils/format';
import FormDialog from '../FormDialog';

interface RetryPaymentDialogProps {
	customer: Customer;
	// Only offered for a vehicle with an overdue membership
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// Confirm before charging, and say what happens if it goes through
const RetryPaymentDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
	onStale,
}: RetryPaymentDialogProps) => {
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const subscription = vehicle.subscription;
	if (!subscription) return null;
	const amount = formatMoney(subscription.price);

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			await retryPayment(customer._id, vehicle._id);
			onSaved(`${amount} charged for ${vehicle.plate}. Membership is active`);
		} catch (err) {
			// e.g. 409 if someone else already resolved it
			const { message, stale } = describeWriteError(err);
			setServerError(message);
			if (stale) onStale();
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Retry payment for ${vehicle.plate}?`}
			submitLabel={`Charge ${amount}`}
			saving={saving}
			serverError={serverError}
			canSubmit
			onSubmit={handleSubmit}
			onClose={onClose}>
			<Typography>
				This charges {amount} for the {PLANS[subscription.plan].name}{' '}
				membership. If it goes through, the membership becomes active and the
				next billing date moves to a month from today.
			</Typography>
		</FormDialog>
	);
};

export default RetryPaymentDialog;
