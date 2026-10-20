import type { PlanKey } from '../types';

// Mirrors server/utils/plans.ts. Two copies can drift apart; at scale both apps would import
// plans and API types from a shared package. Rows always show subscription.price (the price
// locked in at signup), so this is only for names and for picking a plan.

// `includes` is sample content for the demo, shown on the plan cards; in production
// it would come from the server's plan configuration.

const PLANS: Record<
	PlanKey,
	{ name: string; price: number; includes: string[] }
> = {
	basic: {
		name: 'Basic',
		price: 1999,
		includes: ['Exterior wash', 'Spot-free rinse', 'Power dry'],
	},
	deluxe: {
		name: 'Deluxe',
		price: 2999,
		includes: [
			'Everything in Basic',
			'Undercarriage wash',
			'Triple foam',
			'Tire shine',
		],
	},
	ultimate: {
		name: 'Ultimate',
		price: 3999,
		includes: [
			'Everything in Deluxe',
			'Ceramic wax',
			'Wheel cleaner',
			'Rain repellent',
		],
	},
};

export default PLANS;
