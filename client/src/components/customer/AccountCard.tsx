import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
	Box,
	Button,
	Divider,
	Link,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import type { Customer } from '../../types';
import { formatPhone } from '../../utils/format';
import { hasLiveMembership } from '../../utils/vehicleForm';
import CancelAccountDialog from './CancelAccountDialog';
import EditAccountDialog from './EditAccountDialog';

interface AccountCardProps {
	customer: Customer;
	onSaved: (message: string) => void;
	onStale: () => void;
}

// Contact details a CSR confirms at the start of a call, and where they correct them
const AccountCard = ({ customer, onSaved, onStale }: AccountCardProps) => {
	const [editing, setEditing] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const hasLive = customer.vehicles.some(hasLiveMembership);

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

			{/* Set apart from Edit and in red, since it ends every membership on the account.
			    Always visible; when there's nothing to cancel, the tooltip says so. */}
			<Divider sx={{ my: 2 }} />
			<Tooltip title={hasLive ? '' : 'No active memberships to cancel'}>
				{/* A disabled button ignores the mouse, so the span is what shows the tooltip */}
				<Box component='span' sx={{ display: 'inline-block' }}>
					<Button
						size='small'
						color='error'
						disabled={!hasLive}
						onClick={() => setCancelling(true)}>
						Cancel account
					</Button>
				</Box>
			</Tooltip>

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

			{cancelling && (
				<CancelAccountDialog
					customer={customer}
					onClose={() => setCancelling(false)}
					onSaved={(message) => {
						setCancelling(false);
						onSaved(message);
					}}
					onStale={onStale}
				/>
			)}
		</Paper>
	);
};

export default AccountCard;
