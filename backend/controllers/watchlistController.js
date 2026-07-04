import Watchlist from '../models/Watchlist.js';
import Stock from '../models/Stock.js';

// @desc    Get user watchlist with full stock data
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.user._id, symbols: [] });
    }

    // Fetch details of all watched symbols
    const stocks = await Stock.find({ symbol: { $in: watchlist.symbols } });
    
    return res.json(stocks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Add stock to watchlist
// @route   POST /api/watchlist/add
// @access  Private
export const addToWatchlist = async (req, res) => {
  const { symbol } = req.body;
  
  if (!symbol) {
    return res.status(400).json({ message: 'Please provide a stock symbol' });
  }
  
  const uppercaseSymbol = symbol.toUpperCase();

  try {
    // Check if stock exists
    const stock = await Stock.findOne({ symbol: uppercaseSymbol });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.user._id, symbols: [uppercaseSymbol] });
    } else {
      if (watchlist.symbols.includes(uppercaseSymbol)) {
        return res.status(400).json({ message: 'Stock already in watchlist' });
      }
      watchlist.symbols.push(uppercaseSymbol);
      await watchlist.save();
    }

    // Return updated watchlist with stock details
    const watchedStocks = await Stock.find({ symbol: { $in: watchlist.symbols } });
    return res.json(watchedStocks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Remove stock from watchlist
// @route   POST /api/watchlist/remove
// @access  Private
export const removeFromWatchlist = async (req, res) => {
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ message: 'Please provide a stock symbol' });
  }

  const uppercaseSymbol = symbol.toUpperCase();

  try {
    const watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }

    watchlist.symbols = watchlist.symbols.filter(s => s !== uppercaseSymbol);
    await watchlist.save();

    // Return updated watchlist with stock details
    const watchedStocks = await Stock.find({ symbol: { $in: watchlist.symbols } });
    return res.json(watchedStocks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
