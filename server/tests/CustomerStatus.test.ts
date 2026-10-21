import { describe, expect, it } from 'vitest';
import deriveCustomerStatus from '../utils/customerStatus';

const car = (status?: 'active' | 'overdue' | 'cancelled') =>
	status ? { subscription: { status } } : {};

describe('deriveCustomerStatus', () => {
	it('is inactive with no vehicles', () => {
		expect(deriveCustomerStatus([])).toBe('inactive');
	});

	it('is inactive when no car has a live membership', () => {
		expect(deriveCustomerStatus([car(), car('cancelled')])).toBe('inactive');
	});

	it('is active when any car is active', () => {
		expect(deriveCustomerStatus([car('cancelled'), car('active')])).toBe(
			'active',
		);
	});

	// A CSR most needs to see that a payment failed, even if another car is fine
	it('is overdue when any car is overdue, even alongside an active one', () => {
		expect(deriveCustomerStatus([car('active'), car('overdue')])).toBe(
			'overdue',
		);
	});
});
