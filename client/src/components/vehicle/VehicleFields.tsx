import { Stack, TextField } from '@mui/material';
import type { ChangeEvent } from 'react';
import type { VehicleErrors, VehicleForm } from '../../utils/vehicleForm';

interface VehicleFieldsProps {
	form: VehicleForm;
	errors: VehicleErrors;
	onChange: (field: keyof VehicleForm, value: string) => void;
	disabled: boolean;
}

// Plate, year, make, model, and color; used when adding a vehicle and when transferring to a new one
const VehicleFields = ({
	form,
	errors,
	onChange,
	disabled,
}: VehicleFieldsProps) => {
	// Props every field shares, so each one below only states what's different
	const fieldProps = (field: keyof VehicleForm) => ({
		value: form[field],
		onChange: (event: ChangeEvent<HTMLInputElement>) =>
			onChange(field, event.target.value),
		disabled,
		fullWidth: true,
	});

	return (
		<>
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
		</>
	);
};

export default VehicleFields;
