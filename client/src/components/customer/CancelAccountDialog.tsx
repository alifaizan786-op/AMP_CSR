import { Alert, Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { cancelAccount } from '../../api/customers';
import PLANS from '../../constants/plans';
import type { Customer } from '../../types';
import { formatMoney, fullName } from '../../utils/format';
import { hasLiveMembership } from '../../utils/vehicleForm';
import CancelReasonField from '../CancelReasonField';
import FormDialog from '../FormDialog';
import StatusChip from '../StatusChip';

interface CancelAccountDialogProps {
	// Only offered when the customer has at least one active or overdue membership
	customer: Customer;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// "I want to cancel my account": list exactly what ends, then cancel it all in one request
const CancelAccountDialog = ({
	customer,
	onClose,
	onSaved,
	onStale,
}: CancelAccountDialogProps) => {
	const [reason, setReason] = useState('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);
	// Set when the save failed because the account changed elsewhere; there's nothing left to retry
	const [conflicted, setConflicted] = useState(false);

	// A snapshot from when the dialog opened, so a refresh after a conflict doesn't empty the list
	const [live] = useState(() => customer.vehicles.filter(hasLiveMembership));
	let unpaid = 0;
	for (let i = 0; i < live.length; i++) {
		const subscription = live[i].subscription;
		if (subscription?.status === 'overdue') unpaid += subscription.price;
	}
	const name = fullName(customer);
	const what =
		live.length === 1 ? 'the membership' : `all ${live.length} memberships`;

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			await cancelAccount(customer._id, reason.trim());
			onSaved(
				live.length === 1
					? `Membership cancelled for ${name}`
					: `${live.length} memberships cancelled for ${name}`,
			);
		} catch (err) {
			// e.g. 409 if the memberships were already cancelled elsewhere
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
			title={
				live.length === 1
					? `Cancel the membership for ${name}?`
					: `Cancel all memberships for ${name}?`
			}
			submitLabel={
				live.length === 1 ? 'Cancel membership' : 'Cancel all memberships'
			}
			submitColor='error'
			cancelLabel='Keep account'
			saving={saving}
			serverError={serverError}
			canSubmit={reason.trim() !== '' && !conflicted}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<Typography>
				This cancels {what} now. No further charges. The account, vehicles, and
				history stay, so the customer can rejoin later.
			</Typography>

			{/* Exactly what ends, so the CSR can read it back to the customer */}
			<Box
				component='ul'
				sx={{
					m: 0,
					p: 0,
					listStyle: 'none',
					border: 1,
					borderColor: 'divider',
					borderRadius: 1,
				}}>
				{live.map((vehicle, index) => (
					<Stack
						key={vehicle._id}
						component='li'
						direction='row'
						sx={{
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 1,
							px: 1.5,
							py: 1,
							borderTop: index ? 1 : 0,
							borderColor: 'divider',
						}}>
						<Typography sx={{ fontWeight: 600 }}>{vehicle.plate}</Typography>
						<Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
							<Typography variant='body2'>
								{vehicle.subscription &&
									`${PLANS[vehicle.subscription.plan].name} ${formatMoney(vehicle.subscription.price)}/mo`}
							</Typography>
							{vehicle.subscription?.status === 'overdue' && (
								<StatusChip status='overdue' />
							)}
						</Stack>
					</Stack>
				))}
			</Box>

			{/* Cancelling doesn't settle a failed charge, so give the CSR a chance to collect it first */}
			{unpaid > 0 && (
				<Alert severity='warning'>
					{formatMoney(unpaid)} in failed charges stays in purchase history.
					Retry the payment first if the customer wants to settle it.
				</Alert>
			)}

			<CancelReasonField
				value={reason}
				onChange={setReason}
				disabled={saving}
			/>
		</FormDialog>
	);
};

export default CancelAccountDialog;
