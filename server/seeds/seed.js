require('dotenv').config();
const db = require('../config/connection');
const { Customer, Purchase, Activity } = require('../models');
const { buildSeedData } = require('./seedData');

db.once('open', async () => {
	try {
		await Promise.all([
			Customer.deleteMany({}),
			Purchase.deleteMany({}),
			Activity.deleteMany({}),
		]);

		const { customers, purchases, activities } = buildSeedData();

		// save() runs the pre-save hook that derives each customer's status; insertMany() would skip it
		await Promise.all(customers.map((customer) => customer.save()));
		await Purchase.insertMany(purchases);
		await Activity.insertMany(activities);

		console.log(
			`Seeded ${customers.length} customers, ${purchases.length} purchases, ${activities.length} activities`,
		);
		process.exit(0);
	} catch (error) {
		console.error('Seed failed:', error);
		process.exit(1);
	}
});
