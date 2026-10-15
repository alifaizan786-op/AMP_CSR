import { Typography } from '@mui/material';
import { useState } from 'react';
import { removeVehicle } from '../../api/vehicles';
import type { Customer, Vehicle } from '../../types';
import { describeVehicle } from '../../utils/format';
import FormDialog from '../FormDialog';

interface RemoveVehicleDialogProps {
	customer: Customer;
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
}

// Removing can't be undone, so confirm first and say what is (and isn't) lost
const RemoveVehicleDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
}: RemoveVehicleDialogProps) => {
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			await removeVehicle(customer._id, vehicle._id);
			onSaved(`${vehicle.plate} removed`);
		} catch (err) {
			// e.g. 409 if the vehicle has a live membership
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Remove ${vehicle.plate}?`}
			submitLabel='Remove'
			submitColor='error'
			saving={saving}
			serverError={serverError}
			canSubmit
			onSubmit={handleSubmit}
			onClose={onClose}>
			<Typography>
				{describeVehicle(vehicle) || 'This vehicle'} will be removed from this
				account. Its purchase history stays.
			</Typography>
		</FormDialog>
	);
};

export default RemoveVehicleDialog;
