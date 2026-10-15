import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button, Link, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { Customer } from '../../types';
import { formatPhone } from '../../utils/format';
import EditAccountDialog from './EditAccountDialog';

interface AccountCardProps {
	customer: Customer;
	onSaved: (message: string) => void;
}

// Contact details a CSR confirms at the start of a call, and where they correct them
const AccountCard = ({ customer, onSaved }: AccountCardProps) => {
	const [editing, setEditing] = useState(false);

	const rows = [
		{
			label: 'Email',
			value: <Link href={`mailto:${customer.email}`}>{customer.email}</Link>,
		},
		{
			label: 'Phone',
			value: (
				<Link href={`tel:${customer.phone}`}>
					{formatPhone(customer.phone)}
				</Link>
			),
		},
	];

	return (
		<Paper sx={{ p: 2.5 }}>
			<Stack
				direction='row'
				sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Typography variant='h2'>Account</Typography>
				<Button
					size='small'
					startIcon={<EditOutlinedIcon />}
					onClick={() => setEditing(true)}>
					Edit
				</Button>
			</Stack>
			<Stack spacing={1.5}>
				{rows.map((row) => (
					<div key={row.label}>
						<Typography variant='body2' sx={{ color: 'text.secondary' }}>
							{row.label}
						</Typography>
						<Typography sx={{ wordBreak: 'break-word' }}>
							{row.value}
						</Typography>
					</div>
				))}
			</Stack>

			{editing && (
				<EditAccountDialog
					customer={customer}
					onClose={() => setEditing(false)}
					onSaved={() => {
						setEditing(false);
						onSaved('Account updated');
					}}
				/>
			)}
		</Paper>
	);
};

export default AccountCard;