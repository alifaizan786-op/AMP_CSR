import { Alert, Typography } from '@mui/material';
import { useState } from 'react';
import { startMembership } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import type { Customer, PlanKey, Vehicle } from '../../types';
import { formatDate, formatMoney } from '../../utils/format';
import FormDialog from '../FormDialog';
import PlanCards from './PlanCards';

interface StartMembershipDialogProps {
	customer: Customer;
	// Only offered for a vehicle without an active or overdue membership
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
}

// The server bills the first month right away, so the amount is on the button itself
const StartMembershipDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
}: StartMembershipDialogProps) => {
	const [plan, setPlan] = useState<PlanKey | ''>('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const amount = plan ? formatMoney(PLANS[plan].price) : '';
	const nextBilling = new Date();
	nextBilling.setMonth(nextBilling.getMonth() + 1);
	// A cancelled membership on this car gets replaced; its history stays in the activity log
	const previous =
		vehicle.subscription?.status === 'cancelled' ? vehicle.subscription : null;

	const handleSubmit = async () => {
		if (!plan) return;

		setSaving(true);
		setServerError('');
		try {
			await startMembership(customer._id, vehicle._id, plan);
			onSaved(
				`${PLANS[plan].name} membership started on ${vehicle.plate}. ${amount} charged`,
			);
		} catch (err) {
			// e.g. 409 if someone else started one in the meantime
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Start membership on ${vehicle.plate}`}
			submitLabel={plan ? `Start and charge ${amount}` : 'Start membership'}
			maxWidth='md'
			saving={saving}
			serverError={serverError}
			canSubmit={plan !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			{previous && (
				<Alert severity='info'>
					Replaces the cancelled {PLANS[previous.plan].name} membership. Its
					history stays in the activity log.
				</Alert>
			)}

			<PlanCards value={plan} onChange={setPlan} disabled={saving} />

			<Typography variant='body2' sx={{ color: 'text.secondary' }}>
				{plan
					? `Charges ${amount} today. Next billing ${formatDate(nextBilling.toISOString())}.`
					: 'Pick a plan. The first month is charged today.'}
			</Typography>
		</FormDialog>
	);
};

export default StartMembershipDialog;
