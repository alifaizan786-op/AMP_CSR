import { Box, Stack, Typography } from '@mui/material';
import PLANS from '../../constants/plans';
import type { Subscription, Vehicle } from '../../types';
import { formatDate, formatMoney } from '../../utils/format';
import PlateBadge from '../PlateBadge';
import StatusChip from '../StatusChip';

// The one line under the plan that tells a CSR what to do or expect next
const membershipDetail = (subscription: Subscription): string => {
	if (subscription.status === 'overdue') return 'Payment failed, retry needed';
	if (subscription.status === 'cancelled') {
		const date = subscription.cancelledAt
			? formatDate(subscription.cancelledAt)
			: '';
		return subscription.cancelReason
			? `Cancelled ${date}: ${subscription.cancelReason}`
			: `Cancelled ${date}`;
	}
	return subscription.nextBillingDate
		? `Next billing ${formatDate(subscription.nextBillingDate)}`
		: '';
};

const VehicleRow = ({ vehicle }: { vehicle: Vehicle }) => {
	const { subscription } = vehicle;
	// All four fields are optional, so join only the ones that exist
	const carName = [vehicle.year, vehicle.make, vehicle.model]
		.filter(Boolean)
		.join(' ');
	const description = [carName, vehicle.color].filter(Boolean).join(' · ');

	return (
		<Box
			sx={{
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'center',
				gap: 2,
				px: 2.5,
				py: 2,
			}}>
			<PlateBadge plate={vehicle.plate} />
			<Typography sx={{ flexGrow: 1 }}>
				{description || 'Vehicle details not recorded'}
			</Typography>

			{subscription ? (
				<Box sx={{ textAlign: { sm: 'right' } }}>
					<Stack
						direction='row'
						spacing={1}
						sx={{ alignItems: 'center', justifyContent: { sm: 'flex-end' } }}>
						<Typography sx={{ fontWeight: 600 }}>
							{`${PLANS[subscription.plan].name} ${formatMoney(subscription.price)}/mo`}
						</Typography>
						<StatusChip status={subscription.status} />
					</Stack>
					<Typography
						variant='body2'
						sx={{
							mt: 0.5,
							color:
								subscription.status === 'overdue'
									? 'error.main'
									: 'text.secondary',
						}}>
						{membershipDetail(subscription)}
					</Typography>
				</Box>
			) : (
				<Typography sx={{ color: 'text.secondary' }}>No membership</Typography>
			)}
		</Box>
	);
};

export default VehicleRow;
