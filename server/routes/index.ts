import { Router } from 'express';
import customerRoutes from './customers';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/customers', customerRoutes);

export default router;