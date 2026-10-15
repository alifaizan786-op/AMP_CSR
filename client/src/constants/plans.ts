import type { PlanKey } from '../types';

// Mirrors server/utils/plans.ts. Two copies can drift apart; at scale both apps would import
// plans and API types from a shared package. Rows always show subscription.price (the price
// locked in at signup), so this is only for names and for picking a plan.
const PLANS: Record<PlanKey, { name: string; price: number }> = {
	basic: { name: 'Basic', price: 1999 },
	deluxe: { name: 'Deluxe', price: 2999 },
	ultimate: { name: 'Ultimate', price: 3999 },
};

export default PLANS;
