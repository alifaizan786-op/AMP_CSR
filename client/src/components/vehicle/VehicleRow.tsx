import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
	Box,
	IconButton,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import PLANS from '../../constants/plans';
import type { Subscription, Vehicle } from '../../types';
import { describeVehicle, formatDate, formatMoney } from '../../utils/format';
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

interface VehicleRowProps {
	vehicle: Vehicle;
	onRemove: (vehicle: Vehicle) => void;
}

const VehicleRow = ({ vehicle, onRemove }: VehicleRowProps) => {
	// The button the menu opens from; null means the menu is closed
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const { subscription } = vehicle;
	// Matches the server rule: active and overdue memberships must be cancelled or transferred first
	const hasLiveMembership =
		!!subscription && subscription.status !== 'cancelled';

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2.5, pr: 1 }}>
			{/* Details wrap on narrow screens; the menu button stays pinned to the right */}
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					gap: 2,
					flexGrow: 1,
					py: 2,
				}}>
				<PlateBadge plate={vehicle.plate} />
				<Typography sx={{ flexGrow: 1 }}>
					{describeVehicle(vehicle) || 'Vehicle details not recorded'}
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
					<Typography sx={{ color: 'text.secondary' }}>
						No membership
					</Typography>
				)}
			</Box>

			<IconButton
				aria-label={`Actions for ${vehicle.plate}`}
				onClick={(event) => setMenuAnchor(event.currentTarget)}>
				<MoreVertIcon />
			</IconButton>
			<Menu
				anchorEl={menuAnchor}
				open={menuAnchor !== null}
				onClose={() => setMenuAnchor(null)}>
				{/* Disabled with the reason shown, so the CSR knows what to do instead */}
				<MenuItem
					disabled={hasLiveMembership}
					// MUI fades disabled items to 38%, which makes the reason hard to read;
					// only the label is greyed out instead
					sx={{ '&.Mui-disabled': { opacity: 1 } }}
					onClick={() => {
						setMenuAnchor(null);
						onRemove(vehicle);
					}}>
					<ListItemText
						primary='Remove vehicle'
						slotProps={{
							primary: {
								sx: { color: hasLiveMembership ? 'text.disabled' : undefined },
							},
						}}
						secondary={
							hasLiveMembership
								? 'Cancel or transfer the membership first'
								: undefined
						}
					/>
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default VehicleRow;
