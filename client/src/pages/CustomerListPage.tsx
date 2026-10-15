import SearchIcon from '@mui/icons-material/Search';
import {
	Alert,
	Box,
	Button,
	InputAdornment,
	LinearProgress,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCustomers } from '../api/customers';
import PlateBadge from '../components/PlateBadge';
import StatusChip from '../components/StatusChip';
import useDebounce from '../hooks/useDebounce';
import type { CustomerListResponse } from '../types';
import { formatPhone, fullName } from '../utils/format';

const MAX_PLATES_SHOWN = 2;

const CustomerListPage = () => {
	const navigate = useNavigate();
	// The search lives in the URL (?search=jordan), so refresh and the back button keep it
	const [searchParams, setSearchParams] = useSearchParams();
	const search = searchParams.get('search') ?? '';

	// What's typed in the box updates instantly; the URL only updates once typing pauses
	const [searchInput, setSearchInput] = useState(search);
	const debouncedSearch = useDebounce(searchInput.trim());

	useEffect(() => {
		if (debouncedSearch === search) return;
		// replace: true so each search doesn't add a new entry to the browser history
		setSearchParams(debouncedSearch ? { search: debouncedSearch } : {}, {
			replace: true,
		});
	}, [debouncedSearch, search, setSearchParams]);

	const [data, setData] = useState<CustomerListResponse | null>(null);
	const [error, setError] = useState('');

	// Bumping this number re-runs the fetch, which is how "Try again" works
	const [retryCount, setRetryCount] = useState(0);

	// Identifies the request we want: a new search or a retry makes a new key.
	// We're loading until the data (or error) we have belongs to that key.
	const requestKey = `${search}|${retryCount}`;
	const [loadedKey, setLoadedKey] = useState('');
	const loading = loadedKey !== requestKey;

	useEffect(() => {
		const controller = new AbortController();
		const key = `${search}|${retryCount}`;

		getCustomers({ search }, controller.signal)
			.then((response) => {
				setData(response);
				setError('');
				setLoadedKey(key);
			})
			.catch((err: Error) => {
				// An aborted request was replaced by a newer one, so its result doesn't matter
				if (err.name === 'AbortError') return;
				setError(err.message);
				setLoadedKey(key);
			});

		return () => controller.abort();
	}, [search, retryCount]);

	return (
		<Stack spacing={3}>
			<Box>
				<Typography variant='h1' gutterBottom>
					Customers
				</Typography>
				<TextField
					fullWidth
					autoFocus
					placeholder='Search by name, phone, email, or plate'
					value={searchInput}
					onChange={(event) => setSearchInput(event.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position='start'>
									<SearchIcon />
								</InputAdornment>
							),
						},
						htmlInput: { 'aria-label': 'Search customers' },
					}}
					sx={{ bgcolor: 'background.paper' }}
				/>
			</Box>

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
								onClick={() => setRetryCount(retryCount + 1)}>
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

								{data?.customers.length === 0 && !loading && (
									<TableRow>
										<TableCell colSpan={4} sx={{ py: 6, textAlign: 'center' }}>
											<Typography sx={{ fontWeight: 600 }}>
												{search
													? `No customers match "${search}"`
													: 'No customers found'}
											</Typography>
											{search && (
												<Typography variant='body2' color='text.secondary'>
													Try a phone number, email, or license plate instead.
												</Typography>
											)}
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
