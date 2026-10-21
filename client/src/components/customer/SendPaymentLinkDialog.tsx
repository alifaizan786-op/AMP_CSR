import { Alert, Typography } from '@mui/material';
import { useState } from 'react';
import { describeWriteError } from '../../api/client';
import { sendPaymentLink } from '../../api/customers';
import type { Customer } from '../../types';
import { formatExpiry, isCardExpired } from '../../utils/card';
import FormDialog from '../FormDialog';

interface SendPaymentLinkDialogProps {
	customer: Customer;
	onClose: () => void;
	onSaved: (message: string) => void;
}

// The customer updates their own card through a secure link, so a CSR never hears or types a card number.
// A confirm step, since it emails the customer.
const SendPaymentLinkDialog = ({
	customer,
	onClose,
	onSaved,
}: SendPaymentLinkDialogProps) => {
	const [serverError, setServerError] = useState('');
	const [saving, setSaving] = useState(false);
	const card = customer.paymentMethod;

	const handleSubmit = async () => {
		setSaving(true);
		setServerError('');
		try {
			const { sentTo } = await sendPaymentLink(customer._id);
			onSaved(`Card update link sent to ${sentTo}`);
		} catch (err) {
			setServerError(describeWriteError(err).message);
			setSaving(false);
		}
	};

	return (
		<FormDialog
			title='Send card update link?'
			submitLabel='Send link'
			saving={saving}
			serverError={serverError}
			canSubmit
			onSubmit={handleSubmit}
			onClose={onClose}>
			{card && isCardExpired(card) && (
				<Alert severity='warning'>
					The card on file expired {formatExpiry(card)}. Retry payment will work
					once they've updated it.
				</Alert>
			)}
			<Typography>
				Emails a secure link to <strong>{customer.email}</strong> where they can
				update the card on file. Confirm the address with them first.
			</Typography>
		</FormDialog>
	);
};

export default SendPaymentLinkDialog;
