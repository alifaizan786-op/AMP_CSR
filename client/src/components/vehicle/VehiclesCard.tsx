import AddIcon from '@mui/icons-material/Add';
import { Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { Customer, Vehicle } from '../../types';
import AddVehicleDialog from './AddVehicleDialog';
import CancelMembershipDialog from './CancelMembershipDialog';
import ChangePlanDialog from './ChangePlanDialog';
import EditVehicleDialog from './EditVehicleDialog';

import RemoveVehicleDialog from './RemoveVehicleDialog';
import RetryPaymentDialog from './RetryPaymentDialog';
import StartMembershipDialog from './StartMembershipDialog';
import TransferDialog from './TransferDialog';
import VehicleRow from './VehicleRow';

interface VehiclesCardProps {
	customer: Customer;
	onSaved: (message: string) => void;
	onStale: () => void;
}

// Each car and its membership; vehicle actions start here
const VehiclesCard = ({ customer, onSaved, onStale }: VehiclesCardProps) => {
	const [adding, setAdding] = useState(false);
	// The vehicle being confirmed for removal; null when no confirm dialog is open
	const [removing, setRemoving] = useState<Vehicle | null>(null);
	// The vehicle whose details are being corrected
	const [editing, setEditing] = useState<Vehicle | null>(null);
	// The vehicle a membership is being started on
	const [starting, setStarting] = useState<Vehicle | null>(null);
	// The vehicle whose plan is being changed
	const [changing, setChanging] = useState<Vehicle | null>(null);
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
							onStart={setStarting}
							onChangePlan={setChanging}
							onRetry={setRetrying}
							onTransfer={setTransferring}
							onCancel={setCancelling}
							onRemove={setRemoving}
							onEdit={setEditing}
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

			{starting && (
				<StartMembershipDialog
					customer={customer}
					vehicle={starting}
					onClose={() => setStarting(null)}
					onSaved={(message) => {
						setStarting(null);
						onSaved(message);
					}}
					onStale={onStale}
				/>
			)}

			{changing && (
				<ChangePlanDialog
					customer={customer}
					vehicle={changing}
					onClose={() => setChanging(null)}
					onSaved={(message) => {
						setChanging(null);
						onSaved(message);
					}}
					onStale={onStale}
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
					onStale={onStale}
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
					onStale={onStale}
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
					onStale={onStale}
				/>
			)}

			{editing && (
				<EditVehicleDialog
					customer={customer}
					vehicle={editing}
					onClose={() => setEditing(null)}
					onSaved={(message) => {
						setEditing(null);
						onSaved(message);
					}}
					onStale={onStale}
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
					onStale={onStale}
				/>
			)}
		</Paper>
	);
};

export default VehiclesCard;
