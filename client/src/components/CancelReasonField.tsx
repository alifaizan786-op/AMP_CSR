import { TextField } from '@mui/material';

// Matches the server's limit for both membership and account cancellations
const MAX_REASON_LENGTH = 200;

interface CancelReasonFieldProps {
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
}

// Why the customer is leaving; required by the server and kept on the cancelled membership
const CancelReasonField = ({
	value,
	onChange,
	disabled,
}: CancelReasonFieldProps) => (
	<TextField
		label='Reason'
		placeholder='e.g. Moving out of the area'
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

export default CancelReasonField;
