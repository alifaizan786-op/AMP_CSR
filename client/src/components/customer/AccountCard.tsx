import { Link, Paper, Stack, Typography } from '@mui/material';
import type { Customer } from '../../types';
import { formatPhone } from '../../utils/format';

// Contact details a CSR confirms at the start of a call. Editing comes later.
const AccountCard = ({ customer }: { customer: Customer }) => {
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
			<Typography variant='h2' sx={{ mb: 2 }}>
				Account
			</Typography>
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
		</Paper>
	);
};

export default AccountCard;
