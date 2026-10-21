import { Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { updateVehicle } from '../../api/vehicles';
import useVehicleForm from '../../hooks/useVehicleForm';
import type { Customer, Vehicle } from '../../types';
import { toVehicleForm, toVehicleInput } from '../../utils/vehicleForm';
import FormDialog from '../FormDialog';
import VehicleFields from './VehicleFields';

interface EditVehicleDialogProps {
	customer: Customer;
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// Corrects a car's details, e.g. a mistyped plate that stops the car being recognized at the wash
const EditVehicleDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
	onStale,
}: EditVehicleDialogProps) => {
	const { form, errors, changeField, validate } = useVehicleForm(
		toVehicleForm(vehicle),
	);
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);
	// Set when the account changed elsewhere; close and reopen to edit the current details
	const [conflicted, setConflicted] = useState(false);

	// Compared after normalizing, so "fam-2024" against FAM2024 isn't counted as a change
	const input = toVehicleInput(form);
	const hasChanges =
		input.plate !== vehicle.plate ||
		input.year !== vehicle.year ||
		input.make !== vehicle.make ||
		input.model !== vehicle.model ||
		input.color !== vehicle.color;

	const handleSubmit = async () => {
		if (!validate()) return;

		setSaving(true);
		setServerError('');
		try {
			await updateVehicle(customer._id, vehicle._id, input, customer.__v);
			onSaved(`${input.plate} updated`);
		} catch (err) {
			// e.g. 409 if the new plate is already on this account; keep what was typed
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
			title={`Edit ${vehicle.plate}`}
			saving={saving}
			serverError={serverError}
			canSubmit={hasChanges && form.plate.trim() !== '' && !conflicted}
			onSubmit={handleSubmit}
			onClose={onClose}>
			{/* Saying what doesn't change answers the CSR's first question before they ask it */}
			<Typography variant='body2' sx={{ color: 'text.secondary' }}>
				The membership stays on this car. Past receipts keep the plate they were
				charged under.
			</Typography>
			<VehicleFields
				form={form}
				errors={errors}
				onChange={changeField}
				disabled={saving}
			/>
		</FormDialog>
	);
};

export default EditVehicleDialog;
