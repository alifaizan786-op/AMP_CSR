import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplayIcon from '@mui/icons-material/Replay';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
	Box,
	Divider,
	IconButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Menu,
	MenuItem,
	Stack,
	Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import PLANS from '../../constants/plans';
import type { Subscription, Vehicle } from '../../types';
import { describeVehicle, formatDate, formatMoney } from '../../utils/format';
import { hasLiveMembership } from '../../utils/vehicleForm';
import PlateBadge from '../PlateBadge';
import StatusChip from '../StatusChip';

// The one line next to the plan that tells a CSR what to do or expect next
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
	icon: ReactNode;
	// When set, the action is unavailable and this says why (and what to do instead)
	disabledReason?: string;
	// Red when available, so actions that end or remove something stand out
	destructive?: boolean;
	onClick: () => void;
}

const ActionItem = ({
	label,
	icon,
	disabledReason,
	destructive = false,
	onClick,
}: ActionItemProps) => {
	const color = disabledReason
		? 'text.disabled'
		: destructive
			? 'error.main'
			: 'text.primary';

	return (
		<MenuItem
			disabled={!!disabledReason}
			// MUI fades disabled items to 38%, which makes the reason hard to read;
			// only the label and icon are greyed out instead. Disabled items can be
			// focused from the keyboard, so they also need a visible focus state.
			sx={{
				'&.Mui-disabled': { opacity: 1 },
				'&.Mui-disabled:focus': { bgcolor: 'action.focus' },
				alignItems: 'flex-start',
				whiteSpace: 'normal',
			}}
			onClick={onClick}>
			<ListItemIcon sx={{ color, mt: 0.25 }}>{icon}</ListItemIcon>
			<ListItemText
				primary={label}
				secondary={disabledReason}
				slotProps={{ primary: { sx: { color } } }}
			/>
		</MenuItem>
	);
};

const GroupLabel = ({ children }: { children: string }) => (
	<ListSubheader sx={{ lineHeight: '32px' }}>{children}</ListSubheader>
);

interface VehicleRowProps {
	vehicle: Vehicle;
	onStart: (vehicle: Vehicle) => void;
	onChangePlan: (vehicle: Vehicle) => void;
	onRetry: (vehicle: Vehicle) => void;
	onTransfer: (vehicle: Vehicle) => void;
	onCancel: (vehicle: Vehicle) => void;
	onRemove: (vehicle: Vehicle) => void;
}

const VehicleRow = ({
	vehicle,
	onStart,
	onChangePlan,
	onRetry,
	onTransfer,
	onCancel,
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
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 1,
				pl: 2.5,
				pr: 1,
				py: 2,
			}}>
			{/* The car on the first line, its membership on the second */}
			<Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
				<Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
					<PlateBadge plate={vehicle.plate} />
					<Typography>
						{describeVehicle(vehicle) || 'Vehicle details not recorded'}
					</Typography>
				</Stack>

				{subscription ? (
					<Stack
						direction='row'
						sx={{
							alignItems: 'center',
							flexWrap: 'wrap',
							columnGap: 1,
							rowGap: 0.5,
						}}>
						{/* Greyed when cancelled, so the price doesn't read as still billing */}
						<Typography
							sx={
								subscription.status === 'cancelled'
									? { color: 'text.secondary' }
									: { fontWeight: 600 }
							}>
							{`${PLANS[subscription.plan].name} ${formatMoney(subscription.price)}/mo`}
						</Typography>
						<StatusChip status={subscription.status} />
						<Typography
							variant='body2'
							sx={{
								color:
									subscription.status === 'overdue'
										? 'error.main'
										: 'text.secondary',
							}}>
							{membershipDetail(subscription)}
						</Typography>
					</Stack>
				) : (
					<Typography sx={{ color: 'text.secondary' }}>
						No membership
					</Typography>
				)}
			</Stack>

			<IconButton
				aria-label={`Actions for ${vehicle.plate}`}
				onClick={(event) => setMenuAnchor(event.currentTarget)}>
				<MoreVertIcon />
			</IconButton>

			{/* Grouped by the kind of call; unavailable actions stay visible with the reason,
			    so the CSR knows what to do instead */}
			<Menu
				anchorEl={menuAnchor}
				open={menuAnchor !== null}
				onClose={() => setMenuAnchor(null)}
				// disabledItemsFocusable: arrow keys still reach unavailable items,
				// so keyboard and screen reader users hear the reason too
				slotProps={{
					paper: { sx: { width: 320 } },
					list: { disabledItemsFocusable: true },
				}}>
				<GroupLabel>Membership</GroupLabel>
				<ActionItem
					label='Start membership'
					icon={<AddCircleOutlineIcon fontSize='small' />}
					disabledReason={
						isOverdue
							? 'Already has a membership. Retry the payment first'
							: isLive
								? 'Already has a membership. Use Change plan'
								: undefined
					}
					onClick={runAction(onStart)}
				/>
				<ActionItem
					label='Change plan'
					icon={<EditOutlinedIcon fontSize='small' />}
					disabledReason={
						!isLive
							? 'No active membership to change'
							: isOverdue
								? 'Resolve the overdue payment first'
								: undefined
					}
					onClick={runAction(onChangePlan)}
				/>
				<ActionItem
					label='Transfer membership'
					icon={<SwapHorizIcon fontSize='small' />}
					disabledReason={
						isLive ? undefined : 'No active membership to transfer'
					}
					onClick={runAction(onTransfer)}
				/>
				<ActionItem
					label='Cancel membership'
					icon={<BlockIcon fontSize='small' />}
					destructive
					disabledReason={isLive ? undefined : 'No active membership to cancel'}
					onClick={runAction(onCancel)}
				/>

				<Divider />
				<GroupLabel>Payment</GroupLabel>
				<ActionItem
					label='Retry payment'
					icon={<ReplayIcon fontSize='small' />}
					disabledReason={isOverdue ? undefined : 'No overdue payment'}
					onClick={runAction(onRetry)}
				/>

				<Divider />
				<GroupLabel>Vehicle</GroupLabel>
				<ActionItem
					label='Remove vehicle'
					icon={<DeleteOutlineIcon fontSize='small' />}
					destructive
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
