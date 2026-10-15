import { MenuItem, Stack, TextField } from '@mui/material';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { addVehicle } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import type { Customer, PlanKey } from '../../types';
import { formatMoney } from '../../utils/format';
import type { VehicleErrors, VehicleForm } from '../../utils/vehicleForm';
import {
	EMPTY_VEHICLE_FORM,
	normalizePlate,
	toVehicleInput,
	validateVehicle,
} from '../../utils/vehicleForm';
import FormDialog from '../FormDialog';

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
	const [form, setForm] = useState<VehicleForm>(EMPTY_VEHICLE_FORM);
	const [errors, setErrors] = useState<VehicleErrors>({});
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const changeField = (field: keyof VehicleForm, value: string) => {
		setForm({ ...form, [field]: value });
		// Only plate and year are validated; clear their error as soon as the CSR edits them
		if (field === 'plate' || field === 'year') {
			setErrors({ ...errors, [field]: undefined });
		}
	};

	const handleSubmit = async () => {
		const found = validateVehicle(form);
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		setSaving(true);
		setServerError('');
		const plan = form.plan || undefined;
		try {
			await addVehicle(customer._id, toVehicleInput(form), plan);
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

	// Props every text field shares, so each one below only states what's different
	const fieldProps = (field: keyof VehicleForm) => ({
		value: form[field],
		onChange: (event: ChangeEvent<HTMLInputElement>) =>
			changeField(field, event.target.value),
		disabled: saving,
		fullWidth: true,
	});

	return (
		<FormDialog
			title='Add vehicle'
			submitLabel='Add vehicle'
			saving={saving}
			serverError={serverError}
			canSubmit={form.plate.trim() !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<TextField
				{...fieldProps('plate')}
				label='Plate'
				required
				autoFocus
				error={!!errors.plate}
				helperText={errors.plate}
			/>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					{...fieldProps('year')}
					label='Year'
					// Text with a numeric keyboard; type="number" changes value on scroll and accepts "1e3"
					slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
					error={!!errors.year}
					helperText={errors.year}
				/>
				<TextField {...fieldProps('make')} label='Make' />
			</Stack>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField {...fieldProps('model')} label='Model' />
				<TextField {...fieldProps('color')} label='Color' />
			</Stack>
			<TextField
				{...fieldProps('plan')}
				select
				label='Membership'
				// Show "No membership" as a real choice instead of an empty box
				slotProps={{
					select: { displayEmpty: true },
					inputLabel: { shrink: true },
				}}
				// The server bills the first month immediately, so say so before the CSR clicks
				helperText={
					form.plan
						? `Charges ${formatMoney(PLANS[form.plan].price)} today`
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
