import express from 'express';
import { buyStock, sellStock, getTransactions, getHoldings } from '../controllers/tradeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all trading routes
router.use(protect);

router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/transactions', getTransactions);
router.get('/holdings', getHoldings);

export default router;
