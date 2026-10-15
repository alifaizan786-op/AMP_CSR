import { Alert, AlertTitle } from '@mui/material';
import type { Purchase, Vehicle } from '../../types';
import { formatDate, formatMoney } from '../../utils/format';

interface OverdueBannerProps {
	vehicles: Vehicle[];
	purchases: Purchase[];
}

// The first thing a CSR needs on an overdue account: which car, how much, when, and why it failed.
// Driven by subscription status, so an old failed charge that was later paid never shows here.
const OverdueBanner = ({ vehicles, purchases }: OverdueBannerProps) => {
	const lines: string[] = [];

	for (let i = 0; i < vehicles.length; i++) {
		const vehicle = vehicles[i];
		if (vehicle.subscription?.status !== 'overdue') continue;

		// Purchases arrive newest first, so the first match is the latest failure.
		// A transferred membership's failed charge belongs to the old car, so fall back
		// to the latest failure on the account and name the plate it was charged to.
		const failed =
			purchases.find(
				(purchase) =>
					purchase.vehicleId === vehicle._id && purchase.status === 'failed',
			) ?? purchases.find((purchase) => purchase.status === 'failed');
		if (!failed) {
			lines.push(`${vehicle.plate}: payment overdue`);
			continue;
		}
		const chargedTo =
			failed.vehiclePlate && failed.vehiclePlate !== vehicle.plate
				? ` for ${failed.vehiclePlate}`
				: '';
		const reason = failed.failureReason ? ` (${failed.failureReason})` : '';
		lines.push(
			`${vehicle.plate}: ${formatMoney(failed.amount)} failed on ${formatDate(failed.createdAt)}${chargedTo}${reason}`,
		);
	}

	if (lines.length === 0) return null;

	return (
		<Alert severity='error' sx={{ mb: 3 }}>
			<AlertTitle>Payment overdue</AlertTitle>
			{lines.map((line) => (
				<div key={line}>{line}</div>
			))}
		</Alert>
	);
};

export default OverdueBanner;
