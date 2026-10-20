import AddIcon from '@mui/icons-material/Add';
import { Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { Customer, Vehicle } from '../../types';
import AddVehicleDialog from './AddVehicleDialog';
import CancelMembershipDialog from './CancelMembershipDialog';
import RemoveVehicleDialog from './RemoveVehicleDialog';
import RetryPaymentDialog from './RetryPaymentDialog';
import TransferDialog from './TransferDialog';
import VehicleRow from './VehicleRow';

interface VehiclesCardProps {
	customer: Customer;
	onSaved: (message: string) => void;
}

// Each car and its membership; vehicle actions start here
const VehiclesCard = ({ customer, onSaved }: VehiclesCardProps) => {
	const [adding, setAdding] = useState(false);
	// The vehicle being confirmed for removal; null when no confirm dialog is open
	const [removing, setRemoving] = useState<Vehicle | null>(null);
	// The vehicle whose membership is being transferred away
	const [transferring, setTransferring] = useState<Vehicle | null>(null);
	// The overdue vehicle whose payment is being retried
	const [retrying, setRetrying] = useState<Vehicle | null>(null);
	// The vehicle whose membership is being cancelled
	const [cancelling, setCancelling] = useState<Vehicle | null>(null);

	return (
		<Paper>
			<Stack
				direction='row'
				sx={{
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 2.5,
					pt: 2.5,
					pb: 1,
				}}>
				<Typography variant='h2'>
					Vehicles ({customer.vehicles.length})
				</Typography>
				<Button
					size='small'
					startIcon={<AddIcon />}
					onClick={() => setAdding(true)}>
					Add vehicle
				</Button>
			</Stack>

			{customer.vehicles.length === 0 ? (
				<Typography sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
					No vehicles on this account.
				</Typography>
			) : (
				<Stack divider={<Divider />}>
					{customer.vehicles.map((vehicle) => (
						<VehicleRow
							key={vehicle._id}
							vehicle={vehicle}
							onRetry={setRetrying}
							onTransfer={setTransferring}
							onCancel={setCancelling}
							onRemove={setRemoving}
						/>
					))}
				</Stack>
			)}

			{adding && (
				<AddVehicleDialog
					customer={customer}
					onClose={() => setAdding(false)}
					onSaved={(message) => {
						setAdding(false);
						onSaved(message);
					}}
				/>
			)}

			{retrying && (
				<RetryPaymentDialog
					customer={customer}
					vehicle={retrying}
					onClose={() => setRetrying(null)}
					onSaved={(message) => {
						setRetrying(null);
						onSaved(message);
					}}
				/>
			)}

			{transferring && (
				<TransferDialog
					customer={customer}
					vehicle={transferring}
					onClose={() => setTransferring(null)}
					onSaved={(message) => {
						setTransferring(null);
						onSaved(message);
					}}
				/>
			)}

			{cancelling && (
				<CancelMembershipDialog
					customer={customer}
					vehicle={cancelling}
					onClose={() => setCancelling(null)}
					onSaved={(message) => {
						setCancelling(null);
						onSaved(message);
					}}
				/>
			)}

			{removing && (
				<RemoveVehicleDialog
					customer={customer}
					vehicle={removing}
					onClose={() => setRemoving(null)}
					onSaved={(message) => {
						setRemoving(null);
						onSaved(message);
					}}
				/>
			)}
		</Paper>
	);
};

export default VehiclesCard;
