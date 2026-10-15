import AddIcon from '@mui/icons-material/Add';
import { Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { Customer } from '../../types';
import AddVehicleDialog from './AddVehicleDialog';
import VehicleRow from './VehicleRow';

interface VehiclesCardProps {
	customer: Customer;
	onSaved: (message: string) => void;
}

// Each car and its membership; vehicle actions start here
const VehiclesCard = ({ customer, onSaved }: VehiclesCardProps) => {
	const [adding, setAdding] = useState(false);

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
						<VehicleRow key={vehicle._id} vehicle={vehicle} />
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
		</Paper>
	);
};

export default VehiclesCard;
