import { useState } from 'react';
import { addVehicle } from '../../api/vehicles';
import useVehicleForm from '../../hooks/useVehicleForm';
import type { Customer } from '../../types';
import { normalizePlate, toVehicleInput } from '../../utils/vehicleForm';
import FormDialog from '../FormDialog';
import VehicleFields from './VehicleFields';

interface AddVehicleDialogProps {
	customer: Customer;
	onClose: () => void;
	onSaved: (message: string) => void;
}

// Adding a car and starting a membership are separate steps, so the flow is the same
// whether the car is new or has been on the account for years
const AddVehicleDialog = ({
	customer,
	onClose,
	onSaved,
}: AddVehicleDialogProps) => {
	const { form, errors, changeField, validate } = useVehicleForm();
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!validate()) return;

		setSaving(true);
		setServerError('');
		try {
			await addVehicle(customer._id, toVehicleInput(form));
			onSaved(
				`${normalizePlate(form.plate)} added. Start a membership from its menu`,
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
		</FormDialog>
	);
};

export default AddVehicleDialog;
