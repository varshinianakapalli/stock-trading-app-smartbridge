import express from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all watchlist routes
router.use(protect);

router.get('/', getWatchlist);
router.post('/add', addToWatchlist);
router.post('/remove', removeFromWatchlist);

export default router;
