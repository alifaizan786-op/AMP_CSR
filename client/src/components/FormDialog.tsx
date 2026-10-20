import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
} from '@mui/material';
import type { ReactNode, SubmitEvent } from 'react';

interface FormDialogProps {
	title: string;
	submitLabel?: string;
	// 'error' makes the button red for destructive actions like removing a vehicle
	submitColor?: 'primary' | 'error';
	// Renamed where "Cancel" would be confusing, e.g. next to "Cancel membership"
	cancelLabel?: string;
	// Wider for content like plan cards; most dialogs are a few fields
	maxWidth?: 'xs' | 'md';
	saving: boolean;
	serverError: string;
	canSubmit: boolean;
	onSubmit: () => void;
	onClose: () => void;
	children: ReactNode;
}

// The shell every edit dialog shares: server error alert, Cancel/Save, a spinner while saving,
// and no closing mid-save. Each dialog only supplies its fields and what happens on submit.
const FormDialog = ({
	title,
	submitLabel = 'Save',
	submitColor = 'primary',
	cancelLabel = 'Cancel',
	maxWidth = 'xs',
	saving,
	serverError,
	canSubmit,
	onSubmit,
	onClose,
	children,
}: FormDialogProps) => {
	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		// Stop the browser's default form submit, which would reload the page
		event.preventDefault();
		onSubmit();
	};

	return (
		<Dialog
			open
			onClose={saving ? undefined : onClose}
			fullWidth
			maxWidth={maxWidth}>
			{/* A real form, so Enter submits; noValidate so our messages show instead of the browser's */}
			<form onSubmit={handleSubmit} noValidate>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						{serverError && <Alert severity='error'>{serverError}</Alert>}
						{children}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={onClose} disabled={saving}>
						{cancelLabel}
					</Button>
					<Button
						type='submit'
						variant='contained'
						color={submitColor}
						disabled={!canSubmit || saving}
						startIcon={saving ? <CircularProgress size={16} /> : undefined}>
						{submitLabel}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default FormDialog;
