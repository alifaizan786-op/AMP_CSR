import { Router } from 'express';
import {
	addSubscription,
	addVehicle,
	cancelSubscription,
	changePlan,
	removeVehicle,
	retryPayment,
	transferSubscription,
} from '../controllers/vehicleController.ts';

// mergeParams lets these routes read :id from the parent customers router
const router = Router({ mergeParams: true });

// POST /api/customers/:id/vehicles
router.post('/', addVehicle);

// DELETE /api/customers/:id/vehicles/:vehicleId
router.delete('/:vehicleId', removeVehicle);

// POST /api/customers/:id/vehicles/:vehicleId/subscription
router.post('/:vehicleId/subscription', addSubscription);

// PATCH /api/customers/:id/vehicles/:vehicleId/subscription
router.patch('/:vehicleId/subscription', changePlan);

// POST /api/customers/:id/vehicles/:vehicleId/subscription/cancel
router.post('/:vehicleId/subscription/cancel', cancelSubscription);

// POST /api/customers/:id/vehicles/:vehicleId/subscription/transfer
router.post('/:vehicleId/subscription/transfer', transferSubscription);

// POST /api/customers/:id/vehicles/:vehicleId/subscription/retry-payment
router.post('/:vehicleId/subscription/retry-payment', retryPayment);

export default router;
