import { Router } from 'express';
import {
	addNote,
	cancelAccount,
	getCustomerById,
	getCustomers,
	updateCustomer,
} from '../controllers/customerController';
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

// Vehicle and subscription routes,
// under /api/customers/:id/vehicles
router.use('/:id/vehicles', vehicleRoutes);

export default router;
