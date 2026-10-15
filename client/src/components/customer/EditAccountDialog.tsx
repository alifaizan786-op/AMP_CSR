import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from '@mui/material';
import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { updateCustomer } from '../../api/customers';
import type { AccountFields, Customer } from '../../types';
import type { AccountErrors, AccountField } from '../../utils/accountForm';
import {
	normalizeAccountField,
	validateAccount,
} from '../../utils/accountForm';
import { formatPhone } from '../../utils/format';

const FIELDS: { name: AccountField; label: string; type?: string }[] = [
	{ name: 'firstName', label: 'First name' },
	{ name: 'lastName', label: 'Last name' },
	{ name: 'email', label: 'Email', type: 'email' },
	{ name: 'phone', label: 'Phone', type: 'tel' },
];

interface EditAccountDialogProps {
	customer: Customer;
	onClose: () => void;
	onSaved: () => void;
}

// Mounted only while open, so the form starts from the current values every time
const EditAccountDialog = ({
	customer,
	onClose,
	onSaved,
}: EditAccountDialogProps) => {
	const [form, setForm] = useState<AccountFields>({
		firstName: customer.firstName,
		lastName: customer.lastName,
		email: customer.email,
		phone: formatPhone(customer.phone),
	});
	const [errors, setErrors] = useState<AccountErrors>({});
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	// Only send what changed, which is what PATCH is for
	const changes: Partial<AccountFields> = {};
	for (let i = 0; i < FIELDS.length; i++) {
		const field = FIELDS[i].name;
		const value = normalizeAccountField(field, form[field]);
		if (value !== customer[field]) changes[field] = value;
	}
	const hasChanges = Object.keys(changes).length > 0;

	const changeField = (field: AccountField, value: string) => {
		setForm({ ...form, [field]: value });
		// Clear the error as soon as the CSR starts fixing it
		if (errors[field]) setErrors({ ...errors, [field]: undefined });
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		// Stop the browser's default form submit, which would reload the page
		event.preventDefault();

		const found = validateAccount(form);
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		setSaving(true);
		setServerError('');
		try {
			await updateCustomer(customer._id, changes);
			onSaved();
		} catch (err) {
			// e.g. 409 "email already in use"; keep the dialog open so nothing typed is lost
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth='xs'>
			<form onSubmit={handleSubmit} noValidate>
				<DialogTitle>Edit account</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						{serverError && <Alert severity='error'>{serverError}</Alert>}
						{FIELDS.map((field) => (
							<TextField
								key={field.name}
								label={field.label}
								type={field.type}
								value={form[field.name]}
								onChange={(event) =>
									changeField(field.name, event.target.value)
								}
								error={!!errors[field.name]}
								helperText={errors[field.name]}
								disabled={saving}
								fullWidth
							/>
						))}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={onClose} disabled={saving}>
						Cancel
					</Button>
					<Button
						type='submit'
						variant='contained'
						disabled={!hasChanges || saving}
						startIcon={saving ? <CircularProgress size={16} /> : undefined}>
						Save
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default EditAccountDialog;
