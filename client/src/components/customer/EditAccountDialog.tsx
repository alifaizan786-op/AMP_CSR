import { TextField } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { updateCustomer } from '../../api/customers';
import type { AccountFields, Customer } from '../../types';
import type { AccountErrors, AccountField } from '../../utils/accountForm';
import {
	normalizeAccountField,
	validateAccount,
} from '../../utils/accountForm';
import { formatPhone } from '../../utils/format';
import FormDialog from '../FormDialog';

// maxLength matches the server's schema limits (phone allows room for formatting)
const FIELDS: {
	name: AccountField;
	label: string;
	type?: string;
	maxLength: number;
}[] = [
	{ name: 'firstName', label: 'First name', maxLength: 50 },
	{ name: 'lastName', label: 'Last name', maxLength: 50 },
	{ name: 'email', label: 'Email', type: 'email', maxLength: 254 },
	{ name: 'phone', label: 'Phone', type: 'tel', maxLength: 20 },
];

interface EditAccountDialogProps {
	customer: Customer;
	onClose: () => void;
	onSaved: () => void;
	// Reloads the customer when the save failed because the data changed elsewhere
	onStale: () => void;
}

// Mounted only while open, so the form starts from the current values every time
const EditAccountDialog = ({
	customer,
	onClose,
	onSaved,
	onStale,
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

	const handleSubmit = async () => {
		const found = validateAccount(form);
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		setSaving(true);
		setServerError('');
		try {
			await updateCustomer(customer._id, changes);
			onSaved();
		} catch (err) {
			// Keep the dialog open so nothing typed is lost. A 409 here is either "email already
			// in use" or "changed by someone else", and the server's own message fits both, so it's
			// shown as is; the quiet reload only matters for the second.
			setServerError((err as Error).message);
			if (describeWriteError(err).stale) onStale();
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title='Edit account'
			saving={saving}
			serverError={serverError}
			canSubmit={hasChanges}
			onSubmit={handleSubmit}
			onClose={onClose}>
			{FIELDS.map((field) => (
				<TextField
					key={field.name}
					label={field.label}
					type={field.type}
					value={form[field.name]}
					onChange={(event) => changeField(field.name, event.target.value)}
					error={!!errors[field.name]}
					helperText={errors[field.name]}
					disabled={saving}
					slotProps={{ htmlInput: { maxLength: field.maxLength } }}
					fullWidth
				/>
			))}
		</FormDialog>
	);
};

export default EditAccountDialog;
