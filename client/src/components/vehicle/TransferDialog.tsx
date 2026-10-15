import {
	Alert,
	Checkbox,
	FormControlLabel,
	FormHelperText,
	MenuItem,
	Radio,
	RadioGroup,
	TextField,
} from '@mui/material';
import { useState } from 'react';
import type { TransferTarget } from '../../api/vehicles';
import { transferMembership } from '../../api/vehicles';
import PLANS from '../../constants/plans';
import useVehicleForm from '../../hooks/useVehicleForm';
import type { Customer, Vehicle } from '../../types';
import { describeVehicle } from '../../utils/format';
import {
	hasLiveMembership,
	normalizePlate,
	toVehicleInput,
} from '../../utils/vehicleForm';
import FormDialog from '../FormDialog';
import VehicleFields from './VehicleFields';

type Mode = 'existing' | 'new';

interface TransferDialogProps {
	customer: Customer;
	// The vehicle the membership is moving away from
	vehicle: Vehicle;
	onClose: () => void;
	onSaved: (message: string) => void;
}

const TransferDialog = ({
	customer,
	vehicle,
	onClose,
	onSaved,
}: TransferDialogProps) => {
	// Only cars without a live membership can receive one (the server returns 409 otherwise)
	const eligible = customer.vehicles.filter(
		(other) => other._id !== vehicle._id && !hasLiveMembership(other),
	);

	const [mode, setMode] = useState<Mode>(eligible.length ? 'existing' : 'new');
	const [targetId, setTargetId] = useState(eligible[0]?._id ?? '');
	const [removeOld, setRemoveOld] = useState(false);
	const newVehicle = useVehicleForm();
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	// The menu only offers transfer for a live membership, so this is just a type guard
	const subscription = vehicle.subscription;
	if (!subscription) return null;
	const planName = PLANS[subscription.plan].name;

	const handleSubmit = async () => {
		if (mode === 'new' && !newVehicle.validate()) return;

		const target: TransferTarget =
			mode === 'existing'
				? { toVehicleId: targetId }
				: { vehicle: toVehicleInput(newVehicle.form) };
		const targetPlate =
			mode === 'existing'
				? eligible.find((other) => other._id === targetId)?.plate
				: normalizePlate(newVehicle.form.plate);

		setSaving(true);
		setServerError('');
		try {
			await transferMembership(customer._id, vehicle._id, target, removeOld);
			onSaved(`${planName} membership moved to ${targetPlate}`);
		} catch (err) {
			// e.g. 409 if the new plate is already on this account
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title={`Transfer ${planName} membership from ${vehicle.plate}`}
			submitLabel='Transfer'
			saving={saving}
			serverError={serverError}
			canSubmit={
				mode === 'existing'
					? targetId !== ''
					: newVehicle.form.plate.trim() !== ''
			}
			onSubmit={handleSubmit}
			onClose={onClose}>
			{/* Tell the CSR exactly what moves, so they can explain it to the customer */}
			<Alert severity={subscription.status === 'overdue' ? 'warning' : 'info'}>
				Plan, price, and billing date move as-is. No charge.
				{subscription.status === 'overdue' &&
					' The overdue payment moves with it.'}
			</Alert>

			<RadioGroup
				value={mode}
				onChange={(event) => setMode(event.target.value as Mode)}>
				<FormControlLabel
					value='existing'
					control={<Radio />}
					label='Another vehicle on this account'
					disabled={eligible.length === 0 || saving}
				/>
				{eligible.length === 0 && (
					<FormHelperText sx={{ mt: -0.5, ml: 4 }}>
						No other vehicle without a membership
					</FormHelperText>
				)}
				<FormControlLabel
					value='new'
					control={<Radio />}
					label='A new vehicle'
					disabled={saving}
				/>
			</RadioGroup>

			{mode === 'existing' ? (
				<TextField
					select
					label='Move to'
					value={targetId}
					onChange={(event) => setTargetId(event.target.value)}
					disabled={saving}
					fullWidth>
					{eligible.map((other) => (
						<MenuItem key={other._id} value={other._id}>
							{describeVehicle(other)
								? `${other.plate} · ${describeVehicle(other)}`
								: other.plate}
						</MenuItem>
					))}
				</TextField>
			) : (
				<VehicleFields
					form={newVehicle.form}
					errors={newVehicle.errors}
					onChange={newVehicle.changeField}
					disabled={saving}
				/>
			)}

			{/* For the "sold my car" case: move the membership and drop the old car in one step */}
			<FormControlLabel
				control={
					<Checkbox
						checked={removeOld}
						onChange={(event) => setRemoveOld(event.target.checked)}
						disabled={saving}
					/>
				}
				label={`Remove ${vehicle.plate} from the account`}
			/>
		</FormDialog>
	);
};

export default TransferDialog;
