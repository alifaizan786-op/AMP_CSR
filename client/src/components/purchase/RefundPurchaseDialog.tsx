import { Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { refundPurchase } from '../../api/purchases';
import type { Purchase } from '../../types';
import { formatMoney } from '../../utils/format';
import FormDialog from '../FormDialog';
import ReasonField from '../ReasonField';

interface RefundPurchaseDialogProps {
	customerId: string;
	// Only offered for a paid purchase
	purchase: Purchase;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// Full refund of one charge, with the amount on the button so the CSR confirms exactly what goes back
const RefundPurchaseDialog = ({
	customerId,
	purchase,
	onClose,
	onSaved,
	onStale,
}: RefundPurchaseDialogProps) => {
	const [reason, setReason] = useState('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);
	// Set when someone else already refunded it; there's nothing left to do
	const [conflicted, setConflicted] = useState(false);

	const amount = formatMoney(purchase.amount);
	const what =
		purchase.description ??
		(purchase.type === 'single_wash' ? 'Single wash' : 'Membership');
	const plate = purchase.vehiclePlate ? ` on ${purchase.vehiclePlate}` : '';

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			await refundPurchase(customerId, purchase._id, reason.trim());
			onSaved(`${amount} refunded`);
		} catch (err) {
			// e.g. 409 if another CSR refunded it first
			const { message, stale } = describeWriteError(err);
			setServerError(message);
			if (stale) {
				setConflicted(true);
				onStale();
			}
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Refund ${amount} for ${what}${plate}?`}
			submitLabel={`Refund ${amount}`}
			submitColor='error'
			saving={saving}
			serverError={serverError}
			canSubmit={reason.trim() !== '' && !conflicted}
			onSubmit={handleSubmit}
			onClose={onClose}>
			{/* Refunding and cancelling are separate, so a refund never ends a membership by surprise */}
			<Typography>
				The full amount goes back to the customer. This doesn't cancel the
				membership; cancel it separately if the customer is leaving.
			</Typography>
			<ReasonField
				value={reason}
				onChange={setReason}
				disabled={saving}
				placeholder='e.g. Charged twice for the same month'
			/>
		</FormDialog>
	);
};

export default RefundPurchaseDialog;
