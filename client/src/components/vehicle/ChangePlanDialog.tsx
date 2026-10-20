import { Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { changePlan } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import type { Customer, PlanKey, Vehicle } from '../../types';
import { formatDate, formatMoney } from '../../utils/format';
import FormDialog from '../FormDialog';
import PlanCards from './PlanCards';

interface ChangePlanDialogProps {
	customer: Customer;
	// Only offered for a vehicle with an active (not overdue) membership
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// No charge today: the server applies the new price from the next billing date, without proration
const ChangePlanDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
	onStale,
}: ChangePlanDialogProps) => {
	const [plan, setPlan] = useState<PlanKey | ''>('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const subscription = vehicle.subscription;
	if (!subscription) return null;
	const nextBilling = subscription.nextBillingDate
		? formatDate(subscription.nextBillingDate)
		: 'the next billing date';
	const newPrice = plan ? `${formatMoney(PLANS[plan].price)}/mo` : '';

	const handleSubmit = async () => {
		if (!plan) return;

		setSaving(true);
		setServerError('');
		try {
			await changePlan(customer._id, vehicle._id, plan);
			onSaved(
				`${vehicle.plate} moved to ${PLANS[plan].name}. ${newPrice} from ${nextBilling}`,
			);
		} catch (err) {
			// e.g. 409 if the payment failed since the page loaded
			const { message, stale } = describeWriteError(err);
			setServerError(message);
			if (stale) onStale();
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Change plan for ${vehicle.plate}`}
			submitLabel={plan ? `Change to ${PLANS[plan].name}` : 'Change plan'}
			maxWidth='md'
			saving={saving}
			serverError={serverError}
			canSubmit={plan !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<PlanCards
				value={plan}
				onChange={setPlan}
				currentPlan={subscription.plan}
				disabled={saving}
			/>

			<Typography variant='body2' sx={{ color: 'text.secondary' }}>
				{plan
					? `No charge today. ${newPrice} starts on the next billing date, ${nextBilling}.`
					: `Pick a new plan. No charge today; the new price starts on ${nextBilling}.`}
			</Typography>
		</FormDialog>
	);
};

export default ChangePlanDialog;
