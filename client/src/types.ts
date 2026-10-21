// What the API returns. Mirrors the server models, except dates arrive as strings over JSON.

export type CustomerStatus = 'active' | 'overdue' | 'inactive';
export type SubscriptionStatus = 'active' | 'overdue' | 'cancelled';
export type PlanKey = 'basic' | 'deluxe' | 'ultimate';

export interface Subscription {
	plan: PlanKey;
	price: number; // cents
	status: SubscriptionStatus;
	startDate: string;
	nextBillingDate?: string;
	cancelledAt?: string;
	cancelReason?: string;
}

export interface Vehicle {
	_id: string;
	plate: string;
	make?: string;
	model?: string;
	year?: number;
	color?: string;
	subscription?: Subscription;
}

// Display details from the payment processor; the full card number never reaches the app
export interface PaymentMethod {
	brand: string;
	last4: string;
	expMonth: number;
	expYear: number;
}

export interface Customer {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	status: CustomerStatus;
	vehicles: Vehicle[];
	paymentMethod?: PaymentMethod;
	createdAt: string;
	updatedAt: string;
	// Version, bumped on every save; sent back with edits so the server can reject stale ones
	__v: number;
}

// The list endpoint only returns the fields a table row needs
export interface CustomerSummary {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	status: CustomerStatus;
	vehicles: Pick<Vehicle, 'plate' | 'make' | 'model'>[];
}

export interface CustomerListResponse {
	customers: CustomerSummary[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	statusCounts: Record<CustomerStatus, number>;
}

export interface Purchase {
	_id: string;
	vehicleId?: string;
	vehiclePlate?: string;
	type: 'membership' | 'single_wash';
	description?: string;
	amount: number; // cents
	status: 'paid' | 'failed' | 'refunded';
	failureReason?: string;
	refundReason?: string;
	refundedAt?: string;
	createdAt: string;
}

export interface Activity {
	_id: string;
	type: 'note' | 'change';
	message: string;
	author: string;
	createdAt: string;
}

export interface CustomerDetailResponse {
	customer: Customer;
	purchases: Purchase[];
	activities: Activity[];
}

// The account fields a CSR can edit (matches the server's EDITABLE_FIELDS)
export type AccountFields = Pick<
	Customer,
	'firstName' | 'lastName' | 'email' | 'phone'
>;

// What the API accepts when adding a vehicle (plus an optional plan)
export type VehicleInput = Pick<
	Vehicle,
	'plate' | 'year' | 'make' | 'model' | 'color'
>;
