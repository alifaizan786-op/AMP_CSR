import {
	Box,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import type { Purchase } from '../../types';
import { formatDate, formatMoney } from '../../utils/format';
import RefundPurchaseDialog from './RefundPurchaseDialog';

// Keeps long histories from pushing the rest of the page down; the CSR can expand on demand
const INITIAL_ROWS = 10;

// Colored text instead of chips: a whole column of chips is noisy, and only failures need attention
const STATUS_STYLES: Record<
	Purchase['status'],
	{ label: string; color: string; fontWeight: number }
> = {
	paid: { label: 'Paid', color: 'text.primary', fontWeight: 400 },
	failed: { label: 'Failed', color: 'error.main', fontWeight: 700 },
	refunded: { label: 'Refunded', color: 'text.secondary', fontWeight: 400 },
};

interface PurchaseTableProps {
	customerId: string;
	purchases: Purchase[];
	onSaved: (message: string) => void;
	onStale: () => void;
}

const PurchaseTable = ({
	customerId,
	purchases,
	onSaved,
	onStale,
}: PurchaseTableProps) => {
	const [showAll, setShowAll] = useState(false);
	// The purchase being refunded; null when no dialog is open
	const [refunding, setRefunding] = useState<Purchase | null>(null);
	const visible = showAll ? purchases : purchases.slice(0, INITIAL_ROWS);

	return (
		<Paper>
			<Typography variant='h2' sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
				Purchase history ({purchases.length})
			</Typography>

			{purchases.length === 0 ? (
				<Typography sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
					No purchases yet.
				</Typography>
			) : (
				// Scrolls sideways inside the card on narrow screens instead of widening the page
				<TableContainer>
					<Table size='small' sx={{ minWidth: 680 }}>
						<TableHead>
							<TableRow>
								<TableCell>Date</TableCell>
								<TableCell>Description</TableCell>
								<TableCell>Plate</TableCell>
								<TableCell align='right'>Amount</TableCell>
								<TableCell>Status</TableCell>
								{/* Refund lives on the row it applies to; only paid charges can be refunded */}
								<TableCell aria-label='Actions' />
							</TableRow>
						</TableHead>
						<TableBody>
							{visible.map((purchase) => {
								const status = STATUS_STYLES[purchase.status];
								return (
									<TableRow
										key={purchase._id}
										sx={{
											// Same red edge as overdue rows on the list page
											boxShadow: (theme) =>
												purchase.status === 'failed'
													? `inset 3px 0 0 ${theme.palette.error.main}`
													: 'none',
										}}>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											{formatDate(purchase.createdAt)}
										</TableCell>
										<TableCell>
											{purchase.description ??
												(purchase.type === 'single_wash'
													? 'Single wash'
													: 'Membership')}
											{purchase.failureReason && (
												<Typography
													variant='body2'
													sx={{ color: 'error.main' }}>
													{purchase.failureReason}
												</Typography>
											)}
											{purchase.refundReason && (
												<Typography
													variant='body2'
													sx={{ color: 'text.secondary' }}>
													{purchase.refundedAt
														? `Refunded ${formatDate(purchase.refundedAt)}: `
														: 'Refunded: '}
													{purchase.refundReason}
												</Typography>
											)}
										</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>
											{purchase.vehiclePlate}
										</TableCell>
										<TableCell align='right'>
											{formatMoney(purchase.amount)}
										</TableCell>
										<TableCell
											sx={{
												color: status.color,
												fontWeight: status.fontWeight,
											}}>
											{status.label}
										</TableCell>
										<TableCell align='right'>
											{purchase.status === 'paid' && (
												<Button
													size='small'
													onClick={() => setRefunding(purchase)}>
													Refund
												</Button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{purchases.length > INITIAL_ROWS && (
				<Box sx={{ p: 1.5 }}>
					<Button size='small' onClick={() => setShowAll(!showAll)}>
						{showAll ? 'Show fewer' : `Show all ${purchases.length}`}
					</Button>
				</Box>
			)}

			{refunding && (
				<RefundPurchaseDialog
					customerId={customerId}
					purchase={refunding}
					onClose={() => setRefunding(null)}
					onSaved={(message) => {
						setRefunding(null);
						onSaved(message);
					}}
					onStale={onStale}
				/>
			)}
		</Paper>
	);
};

export default PurchaseTable;
