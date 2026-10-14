import { Router } from 'express';
import {
	getCustomerById,
	getCustomers,
} from '../controllers/customerController';

const router = Router();

// GET /api/customers?search=&status=&page=&limit=
router.get('/', getCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomerById);

export default router;
