import { Stack, TextField } from '@mui/material';
import type { ChangeEvent } from 'react';
import type { VehicleErrors, VehicleForm } from '../../utils/vehicleForm';

// Matches the server's 30-character limit on make, model, and color
const TEXT_LIMIT = { slotProps: { htmlInput: { maxLength: 30 } } };

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
				// Room for spaces or dashes ("ABC-1234"); the 8-character rule is checked after they're removed
				slotProps={{ htmlInput: { maxLength: 10 } }}
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
				<TextField {...fieldProps('make')} label='Make' {...TEXT_LIMIT} />
			</Stack>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField {...fieldProps('model')} label='Model' {...TEXT_LIMIT} />
				<TextField {...fieldProps('color')} label='Color' {...TEXT_LIMIT} />
			</Stack>
		</>
	);
};

export default VehicleFields;
