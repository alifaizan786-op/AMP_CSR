import { Router } from 'express';
import {
  addNote,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from '../controllers/customerController';

const router = Router();

// GET /api/customers?search=&status=&page=&limit=
router.get('/', getCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomerById);

// PATCH /api/customers/:id
router.patch('/:id', updateCustomer);

// POST /api/customers/:id/notes
router.post('/:id/notes', addNote);

export default router;