import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Divider,
	Grid,
	Paper,
	Snackbar,
	Stack,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getCustomer } from '../api/customers';
import AccountCard from '../components/customer/AccountCard';
import ActivityList from '../components/customer/ActivityList';
import OverdueBanner from '../components/customer/OverdueBanner';
import PurchaseTable from '../components/customer/PurchaseTable';
import VehicleRow from '../components/customer/VehicleRow';
import StatusChip from '../components/StatusChip';
import type { CustomerDetailResponse } from '../types';
import { fullName } from '../utils/format';

const CustomerDetailPage = () => {
	// ---- Router ----
	const { id = '' } = useParams();
	const location = useLocation();
	// The list page passes its search params, so "Back" returns to the same search, tab, and page.
	// Opened directly (bookmark, new tab) there is no state, so fall back to the plain list.
	const listSearch = (location.state as { listSearch?: string } | null)
		?.listSearch;
	const backTo = listSearch ? `/?${listSearch}` : '/';

	// ---- State ----
	const [data, setData] = useState<CustomerDetailResponse | null>(null);
	const [error, setError] = useState('');
	const [notFound, setNotFound] = useState(false);
	const [reloadCount, setReloadCount] = useState(0);
	const [loadedKey, setLoadedKey] = useState('');
	const [toast, setToast] = useState('');

	// ---- Derived ----
	const requestKey = `${id}|${reloadCount}`;
	const loading = loadedKey !== requestKey;
	// After a save we refetch quietly: keep showing the current customer instead of a spinner
	const hasData = data?.customer._id === id;

	// ---- Effects ----
	useEffect(() => {
		const controller = new AbortController();
		const key = `${id}|${reloadCount}`;

		getCustomer(id, controller.signal)
			.then((response) => {
				setData(response);
				setError('');
				setNotFound(false);
				setLoadedKey(key);
			})
			.catch((err: Error) => {
				if (err.name === 'AbortError') return;
				// 400 is a malformed id, 404 a missing customer: same outcome for a CSR
				const missing =
					err instanceof ApiError && (err.status === 400 || err.status === 404);
				setNotFound(missing);
				setError(missing ? '' : err.message);
				setLoadedKey(key);
			});

		return () => controller.abort();
	}, [id, reloadCount]);

	// ---- Handlers ----
	// A save can also add activity entries or purchases, so refetch everything rather than patch pieces
	const handleSaved = (message: string) => {
		setToast(message);
		setReloadCount((count) => count + 1);
	};

	const backButton = (
		<Button
			component={RouterLink}
			to={backTo}
			startIcon={<ArrowBackIcon />}
			size='small'
			sx={{ mb: 2 }}>
			Back to customers
		</Button>
	);

	if (loading && !hasData) {
		return (
			<>
				{backButton}
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress aria-label='Loading customer' />
				</Box>
			</>
		);
	}

	if (notFound) {
		return (
			<>
				{backButton}
				<Paper sx={{ p: 4, textAlign: 'center' }}>
					<Typography variant='h2'>Customer not found</Typography>
					<Typography sx={{ color: 'text.secondary', mt: 1 }}>
						The link may be wrong, or the customer no longer exists.
					</Typography>
				</Paper>
			</>
		);
	}

	if (error || !data) {
		return (
			<>
				{backButton}
				<Alert
					severity='error'
					action={
						<Button
							color='inherit'
							size='small'
							onClick={() => setReloadCount(reloadCount + 1)}>
							Try again
						</Button>
					}>
					{error}
				</Alert>
			</>
		);
	}

	const { customer } = data;

	return (
		<>
			{backButton}

			<Stack
				direction='row'
				spacing={1.5}
				sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
				<Typography variant='h1'>{fullName(customer)}</Typography>
				<StatusChip status={customer.status} />
			</Stack>

			<OverdueBanner vehicles={customer.vehicles} purchases={data.purchases} />

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 4 }} sx={{ order: { md: 2 } }}>
					<Stack spacing={3}>
						<AccountCard customer={customer} onSaved={handleSaved} />
						<ActivityList activities={data.activities} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 12, md: 8 }}>
					<Stack spacing={3}>
						<Paper>
							<Typography variant='h2' sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
								Vehicles ({customer.vehicles.length})
							</Typography>
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
						</Paper>
						<PurchaseTable purchases={data.purchases} />
					</Stack>
				</Grid>
			</Grid>
			<Snackbar
				open={!!toast}
				autoHideDuration={4000}
				onClose={() => setToast('')}
				message={toast}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			/>
		</>
	);
};

export default CustomerDetailPage;
