import SearchIcon from '@mui/icons-material/Search';
import {
	Alert,
	Box,
	Button,
	InputAdornment,
	LinearProgress,
	Paper,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TablePagination,
	TableRow,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCustomers } from '../api/customers';
import PlateBadge from '../components/PlateBadge';
import StatusChip from '../components/StatusChip';
import useDebounce from '../hooks/useDebounce';
import type { CustomerListResponse, CustomerStatus } from '../types';
import { formatPhone, fullName } from '../utils/format';

const MAX_PLATES_SHOWN = 2;

const PAGE_SIZE = 20; // matches the API's default limit

// Overdue comes right after All: those customers are the most likely to be calling in
const STATUS_TABS: { value: CustomerStatus | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'overdue', label: 'Overdue' },
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'No membership' },
];

// The URL can contain anything, so only accept a real status
const isCustomerStatus = (value: string | null): value is CustomerStatus =>
	value === 'active' || value === 'overdue' || value === 'inactive';

const CustomerListPage = () => {
	// ---- Router ----
	const navigate = useNavigate();
	// Search, status, and page live in the URL (?search=smith&status=overdue&page=2),
	// so refresh and the back button keep the CSR's place
	const [searchParams, setSearchParams] = useSearchParams();

	// ---- Values read from the URL ----
	const search = searchParams.get('search') ?? '';
	const statusParam = searchParams.get('status');
	const status = isCustomerStatus(statusParam) ? statusParam : '';
	const pageParam = searchParams.get('page');
	const pageNumber = Number(pageParam);
	// Page 1 is never written to the URL, so a valid page param is a whole number above 1
	const isValidPage = Number.isInteger(pageNumber) && pageNumber > 1;
	const page = isValidPage ? pageNumber : 1;

	// ---- State ----
	// What's typed in the box updates instantly; the URL only updates once typing pauses
	const [searchInput, setSearchInput] = useState(search);
	// The URL search the box was last matched to; see the sync below
	const [syncedSearch, setSyncedSearch] = useState(search);
	const [data, setData] = useState<CustomerListResponse | null>(null);
	const [error, setError] = useState('');
	// Bumping this number re-runs the fetch, which is how "Try again" works
	const [retryCount, setRetryCount] = useState(0);
	// Which request the current data (or error) belongs to
	const [loadedKey, setLoadedKey] = useState('');

	// When the URL's search changes from outside the box (the "AMP Support" link, back/forward),
	// make the box match. Done during render, React's recommended way to reset state from a
	// changing value; an effect would show the stale text for a frame first.
	if (search !== syncedSearch) {
		setSyncedSearch(search);
		// Compare trimmed so our own debounced write doesn't eat a trailing space mid-typing
		if (searchInput.trim() !== search) setSearchInput(search);
	}

	// ---- Derived values ----
	const debouncedSearch = useDebounce(searchInput.trim());
	// Any change to search, status, page, or a retry makes a new key;
	// we're loading until the data we have belongs to the current key
	const requestKey = `${search}|${status}|${page}|${retryCount}`;
	const loading = loadedKey !== requestKey;
	const counts = data?.statusCounts;
	const allCount = counts
		? counts.active + counts.overdue + counts.inactive
		: undefined;

	// ---- Effects ----
	// Remove values that aren't valid (e.g. ?status=banana or ?page=abc),
	// so the URL matches what's shown
	useEffect(() => {
		const badStatus = statusParam !== null && !isCustomerStatus(statusParam);
		const badPage = pageParam !== null && !isValidPage;
		if (!badStatus && !badPage) return;

		setSearchParams(
			(previous) => {
				const params = new URLSearchParams(previous);
				if (badStatus) params.delete('status');
				if (badPage) params.delete('page');
				return params;
			},
			{ replace: true },
		);
	}, [statusParam, pageParam, isValidPage, setSearchParams]);

	// Write the search to the URL once typing pauses
	useEffect(() => {
		// Only once the debounce has caught up with the box; otherwise a stale value
		// (e.g. "el" right after the box was cleared) would be written back to the URL
		if (debouncedSearch !== searchInput.trim() || debouncedSearch === search)
			return;
		// replace: true so each search doesn't add a new entry to the browser history
		setSearchParams(
			(previous) => {
				const params = new URLSearchParams(previous);
				if (debouncedSearch) params.set('search', debouncedSearch);
				else params.delete('search');
				// A new search starts back on page 1
				params.delete('page');
				return params;
			},
			{ replace: true },
		);
	}, [debouncedSearch, searchInput, search, setSearchParams]);

	// Fetch customers whenever the search, status, page, or retry count changes
	useEffect(() => {
		const controller = new AbortController();
		const key = `${search}|${status}|${page}|${retryCount}`;

		getCustomers(
			{ search, status: status || undefined, page },
			controller.signal,
		)
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
	}, [search, status, page, retryCount]);

	// A page past the end (e.g. an old link to ?page=99) jumps to the last real page
	useEffect(() => {
		if (!data || data.totalPages === 0 || page <= data.totalPages) return;
		const lastPage = data.totalPages;
		setSearchParams(
			(previous) => {
				const params = new URLSearchParams(previous);
				if (lastPage > 1) params.set('page', String(lastPage));
				else params.delete('page');
				return params;
			},
			{ replace: true },
		);
	}, [data, page, setSearchParams]);

	// ---- Event handlers ----
	const changeStatus = (newStatus: string) => {
		setSearchParams((previous) => {
			const params = new URLSearchParams(previous);
			if (newStatus) params.set('status', newStatus);
			else params.delete('status');
			// A different group starts back on page 1
			params.delete('page');
			return params;
		});
	};

	const changePage = (newPage: number) => {
		setSearchParams((previous) => {
			const params = new URLSearchParams(previous);
			// Page 1 is the default, so leave it out to keep the URL clean
			if (newPage > 1) params.set('page', String(newPage));
			else params.delete('page');
			return params;
		});
	};

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
				<Tabs
					value={status}
					onChange={(_, newStatus: string) => changeStatus(newStatus)}
					variant='scrollable'
					sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}>
					{STATUS_TABS.map((tab) => {
						const count = tab.value ? counts?.[tab.value] : allCount;
						return (
							<Tab
								key={tab.label}
								value={tab.value}
								label={
									count === undefined ? tab.label : `${tab.label} (${count})`
								}
								sx={
									tab.value === 'overdue' && count
										? {
												color: 'error.main',
												'&.Mui-selected': { color: 'error.main' },
											}
										: undefined
								}
							/>
						);
					})}
				</Tabs>
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
										// Pass the current search so the detail page's Back link returns here
										onClick={() =>
											navigate(`/customers/${customer._id}`, {
												state: { listSearch: searchParams.toString() },
											})
										}
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
				{data && data.total > 0 && (
					<TablePagination
						component='div'
						count={data.total}
						page={page - 1}
						rowsPerPage={PAGE_SIZE}
						rowsPerPageOptions={[]}
						onPageChange={(_, newPage) => changePage(newPage + 1)}
					/>
				)}
			</Paper>
		</Stack>
	);
};

export default CustomerListPage;
