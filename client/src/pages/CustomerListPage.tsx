import {
	Alert,
	Box,
	Button,
	LinearProgress,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../api/customers';
import PlateBadge from '../components/PlateBadge';
import StatusChip from '../components/StatusChip';
import type { CustomerListResponse } from '../types';
import { formatPhone, fullName } from '../utils/format';

const MAX_PLATES_SHOWN = 2;

const CustomerListPage = () => {
	const navigate = useNavigate();

	const [data, setData] = useState<CustomerListResponse | null>(null);
	const [error, setError] = useState('');

	// Bumping this number re-runs the fetch, which is how "Try again" works
	const [requestId, setRequestId] = useState(0);
	// Which request the current data or error belongs to; anything else means we're still loading
	const [loadedRequestId, setLoadedRequestId] = useState(-1);
	const loading = loadedRequestId !== requestId;

	useEffect(() => {
		const controller = new AbortController();

		getCustomers({}, controller.signal)
			.then((response) => {
				setData(response);
				setError('');
				setLoadedRequestId(requestId);
			})
			.catch((err: Error) => {
				// An aborted request was replaced by a newer one, so its result doesn't matter
				if (err.name === 'AbortError') return;
				setError(err.message);
				setLoadedRequestId(requestId);
			});

		return () => controller.abort();
	}, [requestId]);

	return (
		<Stack spacing={3}>
			<Typography variant='h1'>Customers</Typography>

			<Paper>
				{/* Fixed-height slot so the table doesn't jump when the progress bar appears */}
				<Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>

				{error ? (
					<Alert
						severity='error'
						sx={{ m: 2 }}
						action={
							<Button
								color='inherit'
								size='small'
								onClick={() => setRequestId(requestId + 1)}>
								Try again
							</Button>
						}>
						{error}
					</Alert>
				) : (
					<Box sx={{ overflowX: 'auto' }}>
						<Table size='small' sx={{ minWidth: 640 }}>
							<TableHead>
								<TableRow>
									<TableCell>Customer</TableCell>
									<TableCell>Phone</TableCell>
									<TableCell>Vehicles</TableCell>
									<TableCell>Status</TableCell>
								</TableRow>
							</TableHead>

							<TableBody>
								{data?.customers.map((customer) => (
									<TableRow
										key={customer._id}
										hover
										onClick={() => navigate(`/customers/${customer._id}`)}
										sx={{
											cursor: 'pointer',
											// Red left edge makes overdue accounts easy to spot while scanning
											boxShadow: (theme) =>
												customer.status === 'overdue'
													? `inset 3px 0 0 ${theme.palette.error.main}`
													: 'none',
											// Alternating row shading makes it easier to follow a row across the table
											'&:nth-of-type(even)': { bgcolor: 'background.default' },
											'&.MuiTableRow-hover:hover': {
												bgcolor: 'action.selected',
											},
										}}>
										<TableCell sx={{ py: 1.25 }}>
											<Typography sx={{ fontWeight: 600 }}>
												{fullName(customer)}
											</Typography>
											<Typography variant='body2' color='text.secondary'>
												{customer.email}
											</Typography>
										</TableCell>

										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											{formatPhone(customer.phone)}
										</TableCell>

										<TableCell>
											{customer.vehicles.length === 0 ? (
												<Typography variant='body2' color='text.secondary'>
													None
												</Typography>
											) : (
												<Stack
													direction='row'
													spacing={0.75}
													sx={{ alignItems: 'center' }}>
													{customer.vehicles
														.slice(0, MAX_PLATES_SHOWN)
														.map((vehicle) => (
															<PlateBadge
																key={vehicle.plate}
																plate={vehicle.plate}
															/>
														))}
													{customer.vehicles.length > MAX_PLATES_SHOWN && (
														<Typography variant='body2' color='text.secondary'>
															+{customer.vehicles.length - MAX_PLATES_SHOWN}
														</Typography>
													)}
												</Stack>
											)}
										</TableCell>

										<TableCell>
											<StatusChip status={customer.status} />
										</TableCell>
									</TableRow>
								))}

								{data?.customers.length === 0 && (
									<TableRow>
										<TableCell colSpan={4} sx={{ py: 6, textAlign: 'center' }}>
											<Typography color='text.secondary'>
												No customers found
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</Box>
				)}
			</Paper>
		</Stack>
	);
};

export default CustomerListPage;
