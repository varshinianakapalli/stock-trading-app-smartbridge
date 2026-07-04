import express from 'express';
import { getStocks, getStockBySymbol, createStock, updateStock, deleteStock } from '../controllers/stockController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public stock viewing routes
router.get('/', getStocks);
router.get('/:symbol', getStockBySymbol);

// Admin-only stock management routes
router.post('/admin', protect, admin, createStock);
router.put('/admin/:symbol', protect, admin, updateStock);
router.delete('/admin/:symbol', protect, admin, deleteStock);

export default router;
