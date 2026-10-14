// Prices in cents to avoid floating-point rounding errors in money math
const PLANS = {
	basic: { name: 'Basic', price: 1999 },
	deluxe: { name: 'Deluxe', price: 2999 },
	ultimate: { name: 'Ultimate', price: 3999 },
};

module.exports = PLANS;
