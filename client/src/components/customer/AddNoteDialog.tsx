import { TextField } from '@mui/material';
import { useState } from 'react';
import { addNote } from '../../api/customers';
import FormDialog from '../FormDialog';

// Matches the server's limit
const MAX_NOTE_LENGTH = 1000;

interface AddNoteDialogProps {
	customerId: string;
	onClose: () => void;
	onSaved: () => void;
}

// Free-text note for the next CSR, e.g. what the customer called about
const AddNoteDialog = ({ customerId, onClose, onSaved }: AddNoteDialogProps) => {
	const [message, setMessage] = useState('');
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			await addNote(customerId, message.trim());
			onSaved();
		} catch (err) {
			setServerError((err as Error).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title='Add note'
			submitLabel='Add note'
			saving={saving}
			serverError={serverError}
			canSubmit={message.trim() !== ''}
			onSubmit={handleSubmit}
			onClose={onClose}>
			<TextField
				label='Note'
				placeholder='e.g. Called about the wash gate not opening'
				value={message}
				onChange={(event) => setMessage(event.target.value)}
				multiline
				minRows={3}
				autoFocus
				fullWidth
				disabled={saving}
				slotProps={{ htmlInput: { maxLength: MAX_NOTE_LENGTH } }}
				helperText={`${message.length}/${MAX_NOTE_LENGTH}`}
			/>
		</FormDialog>
	);
};

export default AddNoteDialog;