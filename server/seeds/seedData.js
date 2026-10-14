const { faker } = require('@faker-js/faker');
const { Customer } = require('../models');
const PLANS = require('../utils/plans');

// Fixed seed so every run produces the same customers, which keeps demos predictable
faker.seed(42);

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
// Curated pairs, since faker picks makes and models independently (e.g. "Ford Camry")
const VEHICLES = [
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

const monthsAgo = (months) => {
	const date = new Date();
	date.setMonth(date.getMonth() - months);
	return date;
};

const addMonths = (date, months) => {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
};

const randomPhone = () =>
	faker.helpers.arrayElement(AREA_CODES) + faker.string.numeric(7);

const randomVehicle = () => {
	const [make, model] = faker.helpers.arrayElement(VEHICLES);
	return {
		plate: faker.string.alphanumeric({ length: 7, casing: 'upper' }),
		make,
		model,
		year: faker.number.int({ min: 2012, max: 2026 }),
		color: faker.helpers.arrayElement(COLORS),
	};
};

const buildSubscription = (status, startedMonthsAgo) => {
	const plan = faker.helpers.arrayElement(Object.keys(PLANS));
	const startDate = monthsAgo(startedMonthsAgo);
	const subscription = {
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
const buildMembershipPurchases = (customer, vehicle) => {
	const { subscription } = vehicle;
	const endDate = subscription.cancelledAt || new Date();
	const purchases = [];

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
			description: `${PLANS[subscription.plan].name} monthly membership`,
			amount: subscription.price,
			status: 'paid',
			createdAt: new Date(date),
		});
	}

	if (subscription.status === 'overdue' && purchases.length) {
		const latest = purchases[purchases.length - 1];
		latest.status = 'failed';
		latest.failureReason = faker.helpers.arrayElement(FAILURE_REASONS);
	}
	return purchases;
};

const buildSingleWashes = (customer, count) =>
	Array.from({ length: count }, () => {
		const vehicle = customer.vehicles.length
			? faker.helpers.arrayElement(customer.vehicles)
			: null;
		return {
			customer: customer._id,
			vehicleId: vehicle?._id,
			vehiclePlate: vehicle?.plate,
			type: 'single_wash',
			description: 'Single wash',
			amount: SINGLE_WASH_PRICE,
			status: 'paid',
			createdAt: faker.date.recent({ days: 180 }),
		};
	});

// Hand-built customers so each call scenario from the brief has a known account to demo
const demoCustomers = () => [
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
];

const randomCustomer = (index) => {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	const vehicles = Array.from(
		{ length: faker.number.int({ min: 0, max: 3 }) },
		() => {
			const vehicle = randomVehicle();
			if (faker.datatype.boolean(0.7)) {
				const status = faker.helpers.weightedArrayElement([
					{ weight: 75, value: 'active' },
					{ weight: 12, value: 'overdue' },
					{ weight: 13, value: 'cancelled' },
				]);
				vehicle.subscription = buildSubscription(
					status,
					faker.number.int({ min: 1, max: 12 }),
				);
			}
			return vehicle;
		},
	);

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

const buildSeedData = (randomCount = 50) => {
	const rawCustomers = [
		...demoCustomers(),
		...Array.from({ length: randomCount }, (_, index) => randomCustomer(index)),
	];

	const customers = [];
	const purchases = [];
	const activities = [];

	for (let i = 0; i < rawCustomers.length; i++) {
		// Pull out the seed-only fields so they aren't saved on the customer
		const { note, singleWashes = 0, ...data } = rawCustomers[i];

		// Building the document here gives each customer and vehicle an _id that purchases can reference
		const customer = new Customer(data);
		customers.push(customer);

		for (let j = 0; j < customer.vehicles.length; j++) {
			const vehicle = customer.vehicles[j];
			if (vehicle.subscription)
				purchases.push(...buildMembershipPurchases(customer, vehicle));
		}
		purchases.push(...buildSingleWashes(customer, singleWashes));

		activities.push({
			customer: customer._id,
			type: 'change',
			message: 'Account created',
			author: 'System',
			createdAt: customer.vehicles[0]?.subscription?.startDate || monthsAgo(6),
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

module.exports = { buildSeedData };
