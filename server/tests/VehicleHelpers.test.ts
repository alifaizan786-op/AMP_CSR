import { describe, expect, it } from 'vitest';
import { VehicleDocument } from '../models';
import { endSubscription, hasLiveSubscription } from '../utils/vehicleHelpers';

// Plain objects stand in for Mongoose documents; these helpers only read and set fields
const vehicleWith = (status?: 'active' | 'overdue' | 'cancelled') =>
	({
		plate: 'ABC123',
		subscription: status
			? {
					plan: 'deluxe',
					price: 2999,
					status,
					nextBillingDate: new Date('2026-11-20T12:00:00Z'),
				}
			: undefined,
	}) as unknown as VehicleDocument;

describe('hasLiveSubscription', () => {
	it('treats active and overdue memberships as live', () => {
		expect(hasLiveSubscription(vehicleWith('active'))).toBe(true);
		expect(hasLiveSubscription(vehicleWith('overdue'))).toBe(true);
	});

	it('treats cancelled or missing memberships as not live', () => {
		expect(hasLiveSubscription(vehicleWith('cancelled'))).toBe(false);
		expect(hasLiveSubscription(vehicleWith())).toBe(false);
	});
});

describe('endSubscription', () => {
	it('cancels immediately and stops billing', () => {
		const vehicle = vehicleWith('overdue');
		const now = new Date('2026-10-20T12:00:00Z');

		endSubscription(vehicle, 'Moving away', now);

		expect(vehicle.subscription).toMatchObject({
			status: 'cancelled',
			cancelledAt: now,
			cancelReason: 'Moving away',
			nextBillingDate: undefined,
		});
	});

	it('keeps the plan and the price that was locked in', () => {
		const vehicle = vehicleWith('active');
		endSubscription(vehicle, 'Sold the car');
		expect(vehicle.subscription).toMatchObject({ plan: 'deluxe', price: 2999 });
	});
});
