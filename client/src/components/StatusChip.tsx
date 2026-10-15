import { Chip } from '@mui/material';
import type { CustomerStatus, SubscriptionStatus } from '../types';

// One chip for both customer and subscription statuses, so the colors mean the same thing everywhere.
// Colors are theme keys, e.g. 'error.main' is the overdue red from theme.ts.
const STATUS_STYLES: Record<
	CustomerStatus | SubscriptionStatus,
	{ label: string; color: string }
> = {
	active: { label: 'Active', color: 'success.main' },
	overdue: { label: 'Overdue', color: 'error.main' },
	inactive: { label: 'No membership', color: 'text.secondary' },
	cancelled: { label: 'Cancelled', color: 'text.secondary' },
};

const StatusChip = ({
	status,
}: {
	status: CustomerStatus | SubscriptionStatus;
}) => {
	const { label, color } = STATUS_STYLES[status];

	return (
		<Chip
			label={label}
			size='small'
			variant='outlined'
			sx={{ color, borderColor: color, fontWeight: 600 }}
		/>
	);
};

export default StatusChip;
