import { Router } from 'express';
import {
	addNote,
	cancelAccount,
	getCustomerById,
	getCustomers,
	sendPaymentLink,
	updateCustomer,
} from '../controllers/customerController';
import purchaseRoutes from './purchases';
import vehicleRoutes from './vehicles';

const router = Router();

// GET /api/customers?search=&status=&page=&limit=
router.get('/', getCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomerById);

// PATCH /api/customers/:id
router.patch('/:id', updateCustomer);

// POST /api/customers/:id/notes
router.post('/:id/notes', addNote);

// POST /api/customers/:id/cancel
router.post('/:id/cancel', cancelAccount);

// POST /api/customers/:id/payment-link
router.post('/:id/payment-link', sendPaymentLink);

// Purchase routes, under /api/customers/:id/purchases
router.use('/:id/purchases', purchaseRoutes);

// Vehicle and subscription routes,
// under /api/customers/:id/vehicles
router.use('/:id/vehicles', vehicleRoutes);

export default router;
