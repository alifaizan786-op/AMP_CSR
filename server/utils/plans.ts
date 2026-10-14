// Prices in cents to avoid floating-point rounding errors in money math
const PLANS = {
	basic: { name: 'Basic', price: 1999 },
	deluxe: { name: 'Deluxe', price: 2999 },
	ultimate: { name: 'Ultimate', price: 3999 },
};

export type PlanKey = keyof typeof PLANS;

// Narrows unknown input (like a request body field) to a valid plan key
export const isPlanKey = (value: unknown): value is PlanKey =>
	typeof value === 'string' && value in PLANS;

export default PLANS;
