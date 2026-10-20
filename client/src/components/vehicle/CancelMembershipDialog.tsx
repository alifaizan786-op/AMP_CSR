import { Alert, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { cancelMembership } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import type { Customer, Vehicle } from '../../types';
import { formatMoney } from '../../utils/format';
import FormDialog from '../FormDialog';

// Matches the server's limit
const MAX_REASON_LENGTH = 200;

interface CancelMembershipDialogProps {
	customer: Customer;
	// Only offered for a vehicle with an active or overdue membership
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// Confirm, say exactly what happens, and record why the customer is leaving
const CancelMembershipDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
	onStale,
}: CancelMembershipDialogProps) => {
	const [reason, setReason] = useState('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const subscription = vehicle.subscription;
	if (!subscription) return null;
	const planName = PLANS[subscription.plan].name;

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			const updated = await cancelMembership(
				customer._id,
				vehicle._id,
				reason.trim(),
			);
			// Name the plan the server actually cancelled; it may have changed in another tab
			const cancelledPlan =
				updated.vehicles.find((other) => other._id === vehicle._id)
					?.subscription?.plan ?? subscription.plan;
			onSaved(
				`${PLANS[cancelledPlan].name} membership on ${vehicle.plate} cancelled`,
			);
		} catch (err) {
			// e.g. 409 if someone else already cancelled or transferred it
			const { message, stale } = describeWriteError(err);
			setServerError(message);
			if (stale) onStale();
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Cancel ${planName} membership on ${vehicle.plate}?`}
			submitLabel='Cancel membership'
			submitColor='error'
			cancelLabel='Keep membership'
			saving={saving}
			serverError={serverError}
			canSubmit={reason.trim() !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<Typography>
				This cancels the membership now. No further charges. The vehicle stays
				on the account.
			</Typography>

			{/* Cancelling doesn't settle a failed charge, so give the CSR a chance to collect it first */}
			{subscription.status === 'overdue' && (
				<Alert severity='warning'>
					The failed {formatMoney(subscription.price)} charge stays in purchase
					history. Retry the payment first if the customer wants to settle it.
				</Alert>
			)}

			<TextField
				label='Reason'
				placeholder='e.g. Moving out of the area'
				value={reason}
				onChange={(event) => setReason(event.target.value)}
				autoFocus
				required
				fullWidth
				disabled={saving}
				slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
				helperText={`${reason.length}/${MAX_REASON_LENGTH}`}
			/>
		</FormDialog>
	);
};

export default CancelMembershipDialog;
