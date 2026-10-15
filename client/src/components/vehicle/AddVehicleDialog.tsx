import { MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { addVehicle } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import useVehicleForm from '../../hooks/useVehicleForm';
import type { Customer, PlanKey } from '../../types';
import { formatMoney } from '../../utils/format';
import { normalizePlate, toVehicleInput } from '../../utils/vehicleForm';
import FormDialog from '../FormDialog';
import VehicleFields from './VehicleFields';

const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

interface AddVehicleDialogProps {
	customer: Customer;
	onClose: () => void;
	onSaved: (message: string) => void;
}

const AddVehicleDialog = ({
	customer,
	onClose,
	onSaved,
}: AddVehicleDialogProps) => {
	const { form, errors, changeField, validate } = useVehicleForm();
	const [plan, setPlan] = useState<PlanKey | ''>('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!validate()) return;

		setSaving(true);
		setServerError('');
		try {
			await addVehicle(customer._id, toVehicleInput(form), plan || undefined);
			const plate = normalizePlate(form.plate);
			onSaved(
				plan
					? `${plate} added with ${PLANS[plan].name} membership`
					: `${plate} added`,
			);
		} catch (err) {
			// e.g. 409 when the plate is already on this account
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title='Add vehicle'
			submitLabel='Add vehicle'
			saving={saving}
			serverError={serverError}
			canSubmit={form.plate.trim() !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<VehicleFields
				form={form}
				errors={errors}
				onChange={changeField}
				disabled={saving}
			/>
			<TextField
				select
				label='Membership'
				value={plan}
				onChange={(event) => setPlan(event.target.value as PlanKey | '')}
				disabled={saving}
				fullWidth
				// Show "No membership" as a real choice instead of an empty box
				slotProps={{
					select: { displayEmpty: true },
					inputLabel: { shrink: true },
				}}
				// The server bills the first month immediately, so say so before the CSR clicks
				helperText={
					plan
						? `Charges ${formatMoney(PLANS[plan].price)} today`
						: 'A membership can also be started later'
				}>
				<MenuItem value=''>No membership</MenuItem>
				{PLAN_KEYS.map((key) => (
					<MenuItem key={key} value={key}>
						{`${PLANS[key].name} ${formatMoney(PLANS[key].price)}/mo`}
					</MenuItem>
				))}
			</TextField>
		</FormDialog>
	);
};

export default AddVehicleDialog;
