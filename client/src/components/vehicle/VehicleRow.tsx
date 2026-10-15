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
import { hasLiveMembership } from '../../utils/vehicleForm';
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

interface ActionItemProps {
	label: string;
	// When set, the action is unavailable and this says why (and what to do instead)
	disabledReason?: string;
	onClick: () => void;
}

const ActionItem = ({ label, disabledReason, onClick }: ActionItemProps) => (
	<MenuItem
		disabled={!!disabledReason}
		// MUI fades disabled items to 38%, which makes the reason hard to read;
		// only the label is greyed out instead
		sx={{ '&.Mui-disabled': { opacity: 1 } }}
		onClick={onClick}>
		<ListItemText
			primary={label}
			secondary={disabledReason}
			slotProps={{
				primary: {
					sx: { color: disabledReason ? 'text.disabled' : undefined },
				},
			}}
		/>
	</MenuItem>
);

interface VehicleRowProps {
	vehicle: Vehicle;
	onRetry: (vehicle: Vehicle) => void;
	onTransfer: (vehicle: Vehicle) => void;
	onRemove: (vehicle: Vehicle) => void;
}

const VehicleRow = ({
	vehicle,
	onRetry,
	onTransfer,
	onRemove,
}: VehicleRowProps) => {
	// The button the menu opens from; null means the menu is closed
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const { subscription } = vehicle;
	const isLive = hasLiveMembership(vehicle);
	const isOverdue = subscription?.status === 'overdue';

	// Close the menu first, then hand the vehicle to the card that owns the dialogs
	const runAction = (action: (vehicle: Vehicle) => void) => () => {
		setMenuAnchor(null);
		action(vehicle);
	};

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
				<ActionItem
					label='Retry payment'
					disabledReason={isOverdue ? undefined : 'No overdue payment'}
					onClick={runAction(onRetry)}
				/>
				{/* Unavailable actions stay visible with the reason, so the CSR knows what to do instead */}
				<ActionItem
					label='Transfer membership'
					disabledReason={
						isLive ? undefined : 'No active membership to transfer'
					}
					onClick={runAction(onTransfer)}
				/>
				<ActionItem
					label='Remove vehicle'
					disabledReason={
						isLive ? 'Cancel or transfer the membership first' : undefined
					}
					onClick={runAction(onRemove)}
				/>
			</Menu>
		</Box>
	);
};

export default VehicleRow;
