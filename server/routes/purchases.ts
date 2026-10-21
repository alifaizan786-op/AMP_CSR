import { Router } from 'express';
import { refundPurchase } from '../controllers/purchaseController';

// mergeParams lets these routes read :id from the parent customers router
const router = Router({ mergeParams: true });

// POST /api/customers/:id/purchases/:purchaseId/refund
router.post('/:purchaseId/refund', refundPurchase);

export default router;
