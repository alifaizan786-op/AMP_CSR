import { TextField } from '@mui/material';

// Matches the server's limit for every reason (cancellations and refunds)
const MAX_REASON_LENGTH = 200;

interface ReasonFieldProps {
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
	placeholder: string;
}

// Why the CSR is cancelling or refunding; required by the server and kept with the record
const ReasonField = ({
	value,
	onChange,
	disabled,
	placeholder,
}: ReasonFieldProps) => (
	<TextField
		label='Reason'
		placeholder={placeholder}
		value={value}
		onChange={(event) => onChange(event.target.value)}
		autoFocus
		required
		fullWidth
		disabled={disabled}
		slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
		helperText={`${value.length}/${MAX_REASON_LENGTH}`}
	/>
);

export default ReasonField;
