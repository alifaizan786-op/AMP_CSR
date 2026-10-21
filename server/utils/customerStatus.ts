type SubscriptionStatus = 'active' | 'overdue' | 'cancelled';
type CustomerStatus = 'active' | 'overdue' | 'inactive';

// A customer's status comes from their cars' memberships, so it can never drift out of sync.
// Overdue wins, since it's the status a CSR most needs to see.
const deriveCustomerStatus = (
	vehicles: { subscription?: { status: SubscriptionStatus } | null }[],
): CustomerStatus => {
	const statuses: SubscriptionStatus[] = [];
	for (let i = 0; i < vehicles.length; i++) {
		const subscription = vehicles[i].subscription;
		if (subscription) statuses.push(subscription.status);
	}

	if (statuses.includes('overdue')) return 'overdue';
	if (statuses.includes('active')) return 'active';
	return 'inactive';
};

export default deriveCustomerStatus;
