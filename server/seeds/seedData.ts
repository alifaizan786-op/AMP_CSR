import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { Customer, CustomerDocument, VehicleDocument } from '../models';
import addMonths from '../utils/addMonths';
import PLANS, { PlanKey } from '../utils/plans';

// Fixed seed so every run produces the same customers, which keeps demos predictable
faker.seed(42);

type SubscriptionStatus = 'active' | 'overdue' | 'cancelled';

interface SeedSubscription {
	plan: PlanKey;
	price: number;
	status: SubscriptionStatus;
	startDate: Date;
	nextBillingDate?: Date;
	cancelledAt?: Date;
	cancelReason?: string;
}

interface SeedVehicle {
	plate: string;
	make: string;
	model: string;
	year: number;
	color: string;
	subscription?: SeedSubscription;
}

// note and singleWashes only drive the seed; they aren't saved on the customer
interface SeedCustomer {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	vehicles: SeedVehicle[];
	note?: string;
	singleWashes?: number;
	// Overdue cars' last charge failed for this reason; random when not set
	failureReason?: string;
}

interface SeedPurchase {
	customer: Types.ObjectId;
	vehicleId?: Types.ObjectId;
	vehiclePlate?: string;
	type: 'membership' | 'single_wash';
	description: string;
	amount: number;
	status: 'paid' | 'failed';
	failureReason?: string;
	createdAt: Date;
}

interface SeedActivity {
	customer: Types.ObjectId;
	type: 'note' | 'change';
	message: string;
	author: string;
	createdAt?: Date;
}

const SINGLE_WASH_PRICE = 1200;
const AREA_CODES = [
	'404',
	'470',
	'678',
	'770',
	'305',
	'407',
	'813',
	'214',
	'512',
	'713',
];
const CANCEL_REASONS = [
	'Moving away',
	'Too expensive',
	'Not using it enough',
	'Sold vehicle',
];
const FAILURE_REASONS = ['Card declined', 'Card expired', 'Insufficient funds'];

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'] as const;

// Curated pairs, since faker picks makes and models independently (e.g. "Ford Camry")
const VEHICLES: [string, string][] = [
	['Toyota', 'Camry'],
	['Toyota', 'RAV4'],
	['Honda', 'Civic'],
	['Honda', 'CR-V'],
	['Ford', 'F-150'],
	['Ford', 'Explorer'],
	['Chevrolet', 'Silverado'],
	['Chevrolet', 'Equinox'],
	['Tesla', 'Model Y'],
	['Nissan', 'Altima'],
	['Hyundai', 'Tucson'],
	['Kia', 'Telluride'],
	['Jeep', 'Grand Cherokee'],
	['BMW', 'X5'],
	['Subaru', 'Outback'],
	['Mazda', 'CX-5'],
];
const COLORS = [
	'Black',
	'White',
	'Silver',
	'Gray',
	'Blue',
	'Red',
	'Green',
	'Beige',
];

const monthsAgo = (months: number): Date => addMonths(new Date(), -months);

const randomPhone = (): string =>
	faker.helpers.arrayElement(AREA_CODES) + faker.string.numeric(7);

const randomVehicle = (): SeedVehicle => {
	const [make, model] = faker.helpers.arrayElement(VEHICLES);
	return {
		plate: faker.string.alphanumeric({ length: 7, casing: 'upper' }),
		make,
		model,
		year: faker.number.int({ min: 2012, max: 2026 }),
		color: faker.helpers.arrayElement(COLORS),
	};
};

// A card that expired in the last few months, or one that's valid for a few more years
const buildCard = (expired: boolean) => {
	const expiry = expired
		? monthsAgo(faker.number.int({ min: 1, max: 6 }))
		: monthsAgo(-faker.number.int({ min: 3, max: 48 }));
	return {
		brand: faker.helpers.arrayElement(CARD_BRANDS),
		last4: faker.string.numeric(4),
		expMonth: expiry.getUTCMonth() + 1,
		expYear: expiry.getUTCFullYear(),
	};
};

const buildSubscription = (
	status: SubscriptionStatus,
	startedMonthsAgo: number,
): SeedSubscription => {
	const plan = faker.helpers.arrayElement(Object.keys(PLANS) as PlanKey[]);
	const startDate = monthsAgo(startedMonthsAgo);
	const subscription: SeedSubscription = {
		plan,
		price: PLANS[plan].price,
		status,
		startDate,
		// Billing date falls on the same day each month as the start date
		nextBillingDate: addMonths(startDate, startedMonthsAgo + 1),
	};

	if (status === 'overdue') {
		// The most recent billing attempt failed, so the bill is still due
		subscription.nextBillingDate = addMonths(startDate, startedMonthsAgo);
	}
	if (status === 'cancelled') {
		subscription.cancelledAt = monthsAgo(
			faker.number.int({ min: 0, max: startedMonthsAgo }),
		);
		subscription.cancelReason = faker.helpers.arrayElement(CANCEL_REASONS);
		subscription.nextBillingDate = undefined;
	}
	return subscription;
};

// One membership charge per month since signup; overdue members' latest charge failed
const buildMembershipPurchases = (
	customer: CustomerDocument,
	vehicle: VehicleDocument,
	failureReason?: string,
): SeedPurchase[] => {
	const subscription = vehicle.subscription;
	if (!subscription) return [];

	const plan = subscription.plan as PlanKey;
	const endDate = subscription.cancelledAt || new Date();
	const purchases: SeedPurchase[] = [];

	for (
		let date = new Date(subscription.startDate);
		date <= endDate;
		date = addMonths(date, 1)
	) {
		purchases.push({
			customer: customer._id,
			vehicleId: vehicle._id,
			vehiclePlate: vehicle.plate,
			type: 'membership',
			description: `${PLANS[plan].name} monthly membership`,
			amount: subscription.price,
			status: 'paid',
			createdAt: new Date(date),
		});
	}

	if (subscription.status === 'overdue' && purchases.length) {
		const latest = purchases[purchases.length - 1];
		latest.status = 'failed';
		latest.failureReason =
			failureReason || faker.helpers.arrayElement(FAILURE_REASONS);
	}
	return purchases;
};

const buildSingleWashes = (
	customer: CustomerDocument,
	count: number,
): SeedPurchase[] => {
	const purchases: SeedPurchase[] = [];
	for (let i = 0; i < count; i++) {
		const vehicle = customer.vehicles.length
			? faker.helpers.arrayElement(customer.vehicles)
			: null;
		purchases.push({
			customer: customer._id,
			vehicleId: vehicle?._id,
			vehiclePlate: vehicle?.plate,
			type: 'single_wash',
			description: 'Single wash',
			amount: SINGLE_WASH_PRICE,
			status: 'paid',
			createdAt: faker.date.recent({ days: 180 }),
		});
	}
	return purchases;
};

// Hand-built customers so each call scenario from the brief has a known account to demo
const demoCustomers = (): SeedCustomer[] => [
	{
		firstName: 'Jordan',
		lastName: 'Miles',
		email: 'jordan.miles@example.com',
		phone: '4045550101',
		vehicles: [
			{
				plate: 'OVR1234',
				make: 'Toyota',
				model: 'Camry',
				year: 2021,
				color: 'Silver',
				subscription: buildSubscription('overdue', 5),
			},
		],
		note: 'Called in: says the wash gate will not open',
		// Declined, not expired, so retrying the payment works in the demo
		failureReason: 'Card declined',
	},
	{
		firstName: 'Priya',
		lastName: 'Shah',
		email: 'priya.shah@example.com',
		phone: '4045550102',
		vehicles: [
			{
				plate: 'FAM2024',
				make: 'Honda',
				model: 'Odyssey',
				year: 2022,
				color: 'Blue',
				subscription: buildSubscription('active', 8),
			},
			{
				plate: 'PRY5678',
				make: 'Tesla',
				model: 'Model 3',
				year: 2024,
				color: 'White',
				subscription: buildSubscription('active', 3),
			},
		],
		note: 'Asked about adding a third vehicle next month',
	},
	{
		firstName: 'Marcus',
		lastName: 'Bell',
		email: 'marcus.bell@example.com',
		phone: '4045550103',
		vehicles: [
			{
				plate: 'CNL4321',
				make: 'Ford',
				model: 'F-150',
				year: 2019,
				color: 'Black',
				subscription: buildSubscription('cancelled', 6),
			},
		],
	},
	{
		firstName: 'Elena',
		lastName: 'Ruiz',
		email: 'elena.ruiz@example.com',
		phone: '4045550104',
		vehicles: [
			{
				plate: 'WSH9876',
				make: 'Mazda',
				model: 'CX-5',
				year: 2020,
				color: 'Red',
			},
		],
		singleWashes: 4,
	},
	{
		firstName: 'Sam',
		lastName: 'Carter',
		email: 'sam.carter@example.com',
		phone: '4045550105',
		vehicles: [
			{
				plate: 'EXP2468',
				make: 'Subaru',
				model: 'Outback',
				year: 2020,
				color: 'Green',
				subscription: buildSubscription('overdue', 4),
			},
		],
		// Expired card, so the fix is a card update link rather than a retry
		failureReason: 'Card expired',
	},
];

const randomCustomer = (index: number): SeedCustomer => {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();

	const vehicles: SeedVehicle[] = [];
	const vehicleCount = faker.number.int({ min: 0, max: 3 });
	for (let i = 0; i < vehicleCount; i++) {
		const vehicle = randomVehicle();
		if (faker.datatype.boolean(0.7)) {
			const status = faker.helpers.weightedArrayElement<SubscriptionStatus>([
				{ weight: 75, value: 'active' },
				{ weight: 12, value: 'overdue' },
				{ weight: 13, value: 'cancelled' },
			]);
			vehicle.subscription = buildSubscription(
				status,
				faker.number.int({ min: 1, max: 12 }),
			);
		}
		vehicles.push(vehicle);
	}

	return {
		firstName,
		lastName,
		// example.com is reserved for testing, so seed emails can never reach a real inbox
		email: `${firstName}.${lastName}${index}@example.com`.toLowerCase(),
		phone: randomPhone(),
		vehicles,
		singleWashes: faker.number.int({ min: 0, max: 3 }),
	};
};

export const buildSeedData = (randomCount = 50) => {
	const rawCustomers: SeedCustomer[] = demoCustomers();
	for (let i = 0; i < randomCount; i++) {
		rawCustomers.push(randomCustomer(i));
	}

	const customers: CustomerDocument[] = [];
	const purchases: SeedPurchase[] = [];
	const activities: SeedActivity[] = [];

	for (let i = 0; i < rawCustomers.length; i++) {
		// Pull out the seed-only fields so they aren't saved on the customer
		const { note, singleWashes = 0, failureReason, ...data } = rawCustomers[i];

		// Building the document here gives each customer and vehicle an _id that purchases can reference
		const customer = new Customer(data);
		customers.push(customer);

		const customerPurchases: SeedPurchase[] = [];
		for (let j = 0; j < customer.vehicles.length; j++) {
			customerPurchases.push(
				...buildMembershipPurchases(
					customer,
					customer.vehicles[j],
					failureReason,
				),
			);
		}
		customerPurchases.push(...buildSingleWashes(customer, singleWashes));
		purchases.push(...customerPurchases);

		// The card on file agrees with the failure reason: expired only when a charge failed for that
		let cardExpired = false;
		for (let j = 0; j < customerPurchases.length; j++) {
			if (customerPurchases[j].failureReason === 'Card expired')
				cardExpired = true;
		}
		customer.set('paymentMethod', buildCard(cardExpired));

		// Sign-up is the customer's first membership or purchase, so "Member since",
		// the activity log, and purchase history all agree
		const dates: Date[] = [];
		for (let j = 0; j < customer.vehicles.length; j++) {
			const startDate = customer.vehicles[j].subscription?.startDate;
			if (startDate) dates.push(startDate);
		}
		for (let j = 0; j < customerPurchases.length; j++) {
			dates.push(customerPurchases[j].createdAt);
		}
		let signedUp = dates.length ? dates[0] : monthsAgo(6);
		for (let j = 1; j < dates.length; j++) {
			if (dates[j] < signedUp) signedUp = dates[j];
		}
		customer.set('createdAt', signedUp);

		activities.push({
			customer: customer._id,
			type: 'change',
			message: 'Account created',
			author: 'System',
			createdAt: signedUp,
		});
		if (note)
			activities.push({
				customer: customer._id,
				type: 'note',
				message: note,
				author: 'CSR',
			});
	}

	return { customers, purchases, activities };
};
